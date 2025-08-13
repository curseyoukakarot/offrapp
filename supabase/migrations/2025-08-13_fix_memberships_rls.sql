-- Fix memberships RLS infinite recursion by replacing recursive policies
-- with non-recursive, explicit checks that do not query memberships
-- itself. Safe to run multiple times.

BEGIN;

-- Drop all existing policies on memberships to avoid recursion
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'memberships'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.memberships', r.policyname);
  END LOOP;
END$$;

-- Ensure RLS is enabled
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Helper predicate for super admin (no recursion)
CREATE OR REPLACE FUNCTION public.fn_is_super_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_global_roles ugr
    WHERE ugr.user_id = p_uid
      AND lower(ugr.role) IN ('super_admin','superadmin','super-admin')
  );
$$;

-- Drop by name (idempotent)
DROP POLICY IF EXISTS memberships_select_self_or_super ON public.memberships;
DROP POLICY IF EXISTS memberships_insert_super ON public.memberships;
DROP POLICY IF EXISTS memberships_update_super ON public.memberships;
DROP POLICY IF EXISTS memberships_delete_super ON public.memberships;

-- SELECT: a user can see their own memberships; super admins can see all
CREATE POLICY memberships_select_self_or_super
  ON public.memberships
  FOR SELECT
  USING (
    user_id = auth.uid() OR public.fn_is_super_admin(auth.uid())
  );

-- INSERT: only super admins
CREATE POLICY memberships_insert_super
  ON public.memberships
  FOR INSERT
  WITH CHECK ( public.fn_is_super_admin(auth.uid()) );

-- UPDATE: only super admins
CREATE POLICY memberships_update_super
  ON public.memberships
  FOR UPDATE
  USING ( public.fn_is_super_admin(auth.uid()) )
  WITH CHECK ( public.fn_is_super_admin(auth.uid()) );

-- DELETE: only super admins
CREATE POLICY memberships_delete_super
  ON public.memberships
  FOR DELETE
  USING ( public.fn_is_super_admin(auth.uid()) );

COMMIT;


