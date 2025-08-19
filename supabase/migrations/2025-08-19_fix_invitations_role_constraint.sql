-- Fix invitations table role constraint to support new role system
-- The constraint is still expecting old hardcoded roles like 'recruitpro', 'jobseeker'
-- But we're now using 'admin', 'role1', 'role2', 'role3', 'role4'

-- First, check what the current constraint allows
-- SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name = 'invitations_role_check';

-- Drop the old constraint
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_role_check;

-- Add new constraint that allows the new role keys
ALTER TABLE public.invitations ADD CONSTRAINT invitations_role_check 
CHECK (role IN ('admin', 'role1', 'role2', 'role3', 'role4', 'owner'));

-- Also update any existing invitation records to use new role keys
UPDATE public.invitations 
SET role = CASE 
  WHEN role = 'recruitpro' THEN 'role1'
  WHEN role = 'jobseeker' THEN 'role2' 
  WHEN role = 'client' THEN 'role3'
  WHEN role IN ('owner', 'admin') THEN 'admin'
  ELSE 'role3'
END
WHERE role NOT IN ('admin', 'role1', 'role2', 'role3', 'role4', 'owner');
