-- Fix infinite recursion in RLS policies
-- The issue is that policies on memberships table are calling functions that query memberships again

-- First, drop the problematic policies
DROP POLICY IF EXISTS "memberships_read_as_member" ON public.memberships;
DROP POLICY IF EXISTS "memberships_write_as_member" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_as_member" ON public.memberships;
DROP POLICY IF EXISTS "memberships_delete_as_member" ON public.memberships;

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

-- Fix other policies that might have recursion issues
-- Files policy - use direct membership check without function
DROP POLICY IF EXISTS "files_read_as_member" ON public.files;
DROP POLICY IF EXISTS "files_write_as_member" ON public.files;
DROP POLICY IF EXISTS "files_update_as_member" ON public.files;
DROP POLICY IF EXISTS "files_delete_as_member" ON public.files;

CREATE POLICY "files_super_admin_all" ON public.files
FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "files_member_read" ON public.files
FOR SELECT USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = files.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "files_member_write" ON public.files
FOR INSERT WITH CHECK (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = files.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "files_member_update" ON public.files
FOR UPDATE USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = files.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "files_member_delete" ON public.files
FOR DELETE USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = files.tenant_id 
    AND m.user_id = auth.uid()
  )
);

-- Forms policies
DROP POLICY IF EXISTS "forms_read_as_member" ON public.forms;
DROP POLICY IF EXISTS "forms_write_as_member" ON public.forms;
DROP POLICY IF EXISTS "forms_update_as_member" ON public.forms;
DROP POLICY IF EXISTS "forms_delete_as_member" ON public.forms;

CREATE POLICY "forms_super_admin_all" ON public.forms
FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "forms_member_read" ON public.forms
FOR SELECT USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = forms.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "forms_member_write" ON public.forms
FOR INSERT WITH CHECK (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = forms.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "forms_member_update" ON public.forms
FOR UPDATE USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = forms.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "forms_member_delete" ON public.forms
FOR DELETE USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = forms.tenant_id 
    AND m.user_id = auth.uid()
  )
);

-- Embeds policies  
DROP POLICY IF EXISTS "embeds_read_as_member" ON public.embeds;
DROP POLICY IF EXISTS "embeds_write_as_member" ON public.embeds;
DROP POLICY IF EXISTS "embeds_update_as_member" ON public.embeds;
DROP POLICY IF EXISTS "embeds_delete_as_member" ON public.embeds;

CREATE POLICY "embeds_super_admin_all" ON public.embeds
FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "embeds_member_read" ON public.embeds
FOR SELECT USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = embeds.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "embeds_member_write" ON public.embeds
FOR INSERT WITH CHECK (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = embeds.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "embeds_member_update" ON public.embeds
FOR UPDATE USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = embeds.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "embeds_member_delete" ON public.embeds
FOR DELETE USING (
  is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.tenant_id = embeds.tenant_id 
    AND m.user_id = auth.uid()
  )
);
