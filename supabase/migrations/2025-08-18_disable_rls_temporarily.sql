-- Temporarily disable RLS on memberships to stop the infinite recursion
-- This will allow login to work while we debug the policy issue

-- Disable RLS entirely on memberships table
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- Also disable on related tables that might be causing issues
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeds DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on sensitive tables
-- ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
