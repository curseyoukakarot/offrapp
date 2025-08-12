-- Row Level Security and access helpers (idempotent)

-- Helper: check if user is super admin
CREATE OR REPLACE FUNCTION public.fn_user_is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_global_roles ugr
    WHERE ugr.user_id = uid AND lower(ugr.role) IN ('super_admin','superadmin','super-admin')
  );
$$;

-- Helper: returns role for a user within a tenant (or NULL)
CREATE OR REPLACE FUNCTION public.fn_user_in_tenant(uid uuid, tid uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT m.role
  FROM public.memberships m
  WHERE m.user_id = uid AND m.tenant_id = tid
  LIMIT 1;
$$;

-- Enable RLS on core tables
ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboards ENABLE ROW LEVEL SECURITY;

-- Tenants policies
DO $$ BEGIN
  -- super admin: full access
  CREATE POLICY tenants_super_admin_full ON public.tenants
  USING ( public.fn_user_is_super_admin(auth.uid()) )
  WITH CHECK ( public.fn_user_is_super_admin(auth.uid()) );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- tenant member: read own tenant via membership
  CREATE POLICY tenants_member_read ON public.tenants
  FOR SELECT
  USING (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = tenants.id AND m.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Memberships policies
DO $$ BEGIN
  CREATE POLICY memberships_super_admin_full ON public.memberships
  USING ( public.fn_user_is_super_admin(auth.uid()) )
  WITH CHECK ( public.fn_user_is_super_admin(auth.uid()) );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- Tenant admins can manage memberships in their tenant
  CREATE POLICY memberships_tenant_admin_write ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = memberships.tenant_id
        AND m.user_id = auth.uid()
        AND lower(m.role) IN ('owner','admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY memberships_tenant_admin_update ON public.memberships
  FOR UPDATE TO authenticated
  USING (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = memberships.tenant_id
        AND m.user_id = auth.uid()
        AND lower(m.role) IN ('owner','admin')
    )
  )
  WITH CHECK (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = memberships.tenant_id
        AND m.user_id = auth.uid()
        AND lower(m.role) IN ('owner','admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY memberships_member_read ON public.memberships
  FOR SELECT TO authenticated
  USING (
    public.fn_user_is_super_admin(auth.uid())
    OR memberships.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = memberships.tenant_id AND m.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tenant domains policies
DO $$ BEGIN
  CREATE POLICY tenant_domains_super_admin_full ON public.tenant_domains
  USING ( public.fn_user_is_super_admin(auth.uid()) )
  WITH CHECK ( public.fn_user_is_super_admin(auth.uid()) );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY tenant_domains_member_read ON public.tenant_domains
  FOR SELECT TO authenticated
  USING (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = tenant_domains.tenant_id AND m.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY tenant_domains_admin_write ON public.tenant_domains
  FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = tenant_domains.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN ('owner','admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY tenant_domains_admin_update ON public.tenant_domains
  FOR UPDATE TO authenticated
  USING (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = tenant_domains.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN ('owner','admin')
    )
  )
  WITH CHECK (
    public.fn_user_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = tenant_domains.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN ('owner','admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Template policy generator for tenant-scoped tables
-- Read policies (members of same tenant)
CREATE OR REPLACE FUNCTION public._apply_read_policy(table_name text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE format(
      'CREATE POLICY %I_member_read ON public.%I FOR SELECT TO authenticated USING (
         public.fn_user_is_super_admin(auth.uid()) OR EXISTS (
           SELECT 1 FROM public.memberships m
           WHERE m.tenant_id = %I.tenant_id AND m.user_id = auth.uid()
         )
       )',
      table_name, table_name, table_name
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Write policies (tenant admins)
CREATE OR REPLACE FUNCTION public._apply_write_policies(table_name text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- INSERT
  BEGIN
    EXECUTE format(
      'CREATE POLICY %I_tenant_admin_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (
         public.fn_user_is_super_admin(auth.uid()) OR EXISTS (
           SELECT 1 FROM public.memberships m
           WHERE m.tenant_id = %I.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN (''owner'',''admin'')
         )
       )',
      table_name, table_name, table_name
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- UPDATE
  BEGIN
    EXECUTE format(
      'CREATE POLICY %I_tenant_admin_update ON public.%I FOR UPDATE TO authenticated USING (
         public.fn_user_is_super_admin(auth.uid()) OR EXISTS (
           SELECT 1 FROM public.memberships m
           WHERE m.tenant_id = %I.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN (''owner'',''admin'')
         )
       ) WITH CHECK (
         public.fn_user_is_super_admin(auth.uid()) OR EXISTS (
           SELECT 1 FROM public.memberships m
           WHERE m.tenant_id = %I.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN (''owner'',''admin'')
         )
       )',
      table_name, table_name, table_name, table_name
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- DELETE (optional: tenant admins)
  BEGIN
    EXECUTE format(
      'CREATE POLICY %I_tenant_admin_delete ON public.%I FOR DELETE TO authenticated USING (
         public.fn_user_is_super_admin(auth.uid()) OR EXISTS (
           SELECT 1 FROM public.memberships m
           WHERE m.tenant_id = %I.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN (''owner'',''admin'')
         )
       )',
      table_name, table_name, table_name
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Apply to tenant-scoped tables if present
SELECT public._apply_read_policy('forms') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='forms'
);
SELECT public._apply_write_policies('forms') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='forms'
);

SELECT public._apply_read_policy('files') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='files'
);
SELECT public._apply_write_policies('files') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='files'
);

SELECT public._apply_read_policy('embeds') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='embeds'
);
SELECT public._apply_write_policies('embeds') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='embeds'
);

SELECT public._apply_read_policy('dashboards') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dashboards'
);
SELECT public._apply_write_policies('dashboards') WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dashboards'
);


