-- Backfill default tenant and attach all users
-- Target tenant id provided by user
DO $$
DECLARE
  v_tenant_id uuid := '8fd7f491-f7bf-4b8d-9b15-235b0bb0671e';
BEGIN
  -- Ensure tenant exists and named correctly
  INSERT INTO public.tenants(id, name)
  VALUES (v_tenant_id, 'offr.app')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- Attach every user as a member (role = member) if not already
  INSERT INTO public.memberships(tenant_id, user_id, role)
  SELECT v_tenant_id, u.id, 'member'
  FROM public.users u
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  -- Backfill tenant_id on tenant-scoped tables where missing
  BEGIN
    UPDATE public.forms SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  EXCEPTION WHEN undefined_table THEN
    -- ignore if table doesn't exist
    NULL;
  END;

  BEGIN
    UPDATE public.files SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  BEGIN
    UPDATE public.embeds SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END$$;


