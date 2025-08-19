-- Fix the core issue: infinite recursion in memberships RLS policies
-- This is causing the 500 errors and blocking login

-- Drop all existing memberships policies
DROP POLICY IF EXISTS "memberships_read_as_member" ON public.memberships;
DROP POLICY IF EXISTS "memberships_write_as_member" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_as_member" ON public.memberships;
DROP POLICY IF EXISTS "memberships_delete_as_member" ON public.memberships;
DROP POLICY IF EXISTS "memberships_super_admin_all" ON public.memberships;
DROP POLICY IF EXISTS "memberships_own_read" ON public.memberships;
DROP POLICY IF EXISTS "memberships_own_update" ON public.memberships;
DROP POLICY IF EXISTS "memberships_super_admin_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_super_admin_delete" ON public.memberships;

-- Add unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS ux_memberships_tenant_user ON public.memberships(tenant_id, user_id);

-- Create non-recursive policies for memberships
-- Super admins can see all memberships
CREATE POLICY "memberships_super_admin_all" ON public.memberships
FOR ALL USING (is_super_admin(auth.uid()));

-- Users can see their own memberships (no recursion - direct user_id check)
CREATE POLICY "memberships_own_read" ON public.memberships
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own memberships (for role changes by admins)
CREATE POLICY "memberships_own_update" ON public.memberships
FOR UPDATE USING (user_id = auth.uid());

-- Only super admins can insert/delete memberships
CREATE POLICY "memberships_super_admin_insert" ON public.memberships
FOR INSERT WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "memberships_super_admin_delete" ON public.memberships
FOR DELETE USING (is_super_admin(auth.uid()));
