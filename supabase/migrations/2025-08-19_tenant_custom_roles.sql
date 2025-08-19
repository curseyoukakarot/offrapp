-- Create tenant-specific custom roles system
-- This replaces hardcoded RecruitPro/JobSeeker with tenant-configurable roles

-- Create tenant_roles table for custom roles per tenant
CREATE TABLE IF NOT EXISTS public.tenant_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_key text NOT NULL, -- e.g., 'role1', 'role2', 'role3', 'role4'
  role_label text NOT NULL, -- e.g., 'Sales Rep', 'Customer', 'Manager'
  role_color text NOT NULL DEFAULT 'blue', -- UI color: blue, purple, green, gray, orange, red
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE (tenant_id, role_key)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tenant_roles_tenant_id ON public.tenant_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_roles_active ON public.tenant_roles(tenant_id, is_active);

-- Seed default roles for existing tenants
-- This creates a basic set of roles that tenants can customize
INSERT INTO public.tenant_roles (tenant_id, role_key, role_label, role_color, sort_order)
SELECT 
  t.id as tenant_id,
  role_data.role_key,
  role_data.role_label,
  role_data.role_color,
  role_data.sort_order
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('admin', 'Admin', 'blue', 1),
    ('role1', 'Team Member', 'purple', 2), 
    ('role2', 'Client', 'green', 3),
    ('role3', 'Guest', 'gray', 4)
) AS role_data(role_key, role_label, role_color, sort_order)
ON CONFLICT (tenant_id, role_key) DO NOTHING;

-- Update memberships table to support custom role keys
-- The role column will now store role_key values like 'admin', 'role1', 'role2', etc.
-- instead of hardcoded 'recruitpro', 'jobseeker'

-- Migrate existing memberships from old hardcoded roles to new role keys
UPDATE public.memberships 
SET role = CASE 
  WHEN role = 'recruitpro' THEN 'role1'
  WHEN role = 'jobseeker' THEN 'role2' 
  WHEN role = 'client' THEN 'role3'
  WHEN role IN ('owner', 'admin') THEN 'admin'
  ELSE 'role3' -- default to role3 (guest/client equivalent)
END
WHERE role IN ('recruitpro', 'jobseeker', 'client', 'owner');

-- Also update the users table role constraints to allow the new role keys
-- First drop the old constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that allows admin and role1-role4
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'role1'::text, 'role2'::text, 'role3'::text, 'role4'::text]));

-- Update existing users table records
UPDATE public.users 
SET role = CASE 
  WHEN role = 'recruitpro' THEN 'role1'
  WHEN role = 'jobseeker' THEN 'role2'
  WHEN role = 'offr_client' THEN 'role3'
  WHEN role = 'admin' THEN 'admin'
  ELSE 'role3'
END
WHERE role IN ('recruitpro', 'jobseeker', 'offr_client');
