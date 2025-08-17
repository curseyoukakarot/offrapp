-- Super Admin User Management minimal schema

DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- Extend tenants with required columns
ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS tier text CHECK (tier IN ('starter','pro','advanced')) NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS seats_total int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS seats_used int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active','suspended','trial')) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- App users mirror (optional, if not present). We will not conflict with existing 'users' view.
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  status text CHECK (status IN ('active','pending','disabled')) DEFAULT 'active',
  last_login_at timestamptz
);

-- Ensure memberships has status
ALTER TABLE IF EXISTS public.memberships
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active','pending')) NOT NULL DEFAULT 'active';

-- Invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  role text CHECK (role IN ('owner','admin','member')) NOT NULL DEFAULT 'member',
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  status text CHECK (status IN ('pending','accepted','expired','canceled')) NOT NULL DEFAULT 'pending',
  invited_by uuid,
  bypass_billing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations (lower(email));
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON public.invitations (tenant_id);


