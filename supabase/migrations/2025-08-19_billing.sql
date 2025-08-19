-- Billing schema for tenant plans, usage, and invoices (idempotent)
-- Extends tenants; adds tenant_usage and invoices; RLS + usage recount triggers

-- Ensure pgcrypto for gen_random_uuid
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- Extend tenants with billing fields
ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS plan text;

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS seats_purchased int;

-- Apply defaults and constraints safely
-- plan default 'starter'
DO $$ BEGIN
  ALTER TABLE public.tenants ALTER COLUMN plan SET DEFAULT 'starter';
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- seats_purchased default 1
DO $$ BEGIN
  ALTER TABLE public.tenants ALTER COLUMN seats_purchased SET DEFAULT 1;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- backfill nulls
UPDATE public.tenants SET plan = COALESCE(plan, 'starter');
UPDATE public.tenants SET seats_purchased = COALESCE(seats_purchased, 1);

-- set NOT NULL
DO $$ BEGIN
  ALTER TABLE public.tenants ALTER COLUMN plan SET NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.tenants ALTER COLUMN seats_purchased SET NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- add CHECK constraint for allowed plans
DO $$ BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_plan_check_allowed
    CHECK (lower(plan) IN ('starter','pro','advanced'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- tenant_usage table
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  clients_count int NOT NULL DEFAULT 0,
  team_count int NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

-- invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL,
  amount_cents int NOT NULL,
  status text NOT NULL,
  hosted_invoice_url text,
  created_at timestamptz DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_created ON public.invoices(tenant_id, created_at DESC);

-- RLS enable
ALTER TABLE IF EXISTS public.tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies (align with existing membership-based tenant scoping)
-- tenant_usage: members can select; admins can upsert; service role bypasses RLS
DO $$ BEGIN
  CREATE POLICY tenant_usage_member_select ON public.tenant_usage
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.tenant_id = tenant_usage.tenant_id AND m.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY tenant_usage_admin_upsert ON public.tenant_usage
    FOR ALL TO authenticated
    USING (
      public.is_super_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.tenant_id = tenant_usage.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN ('owner','admin')
      )
    )
    WITH CHECK (
      public.is_super_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.tenant_id = tenant_usage.tenant_id AND m.user_id = auth.uid() AND lower(m.role) IN ('owner','admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- invoices: members can read; writes via service role (webhooks) or super admin
DO $$ BEGIN
  CREATE POLICY invoices_member_select ON public.invoices
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.tenant_id = invoices.tenant_id AND m.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY invoices_super_admin_write ON public.invoices
    FOR ALL TO authenticated
    USING ( public.is_super_admin(auth.uid()) )
    WITH CHECK ( public.is_super_admin(auth.uid()) );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper to recount usage from memberships
CREATE OR REPLACE FUNCTION public.recount_tenant_usage(tid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_clients int;
  v_team int;
BEGIN
  -- Count clients: non-admin/editor roles (treat 'member' and typical end-customer roles as clients)
  SELECT COUNT(*) INTO v_clients
  FROM public.memberships mm
  WHERE mm.tenant_id = tid
    AND lower(mm.role) IN (
      'member','client','jobseeker','recruitpro','role1','role2','role3'
    );

  -- Count team: owner/admin/editor roles
  SELECT COUNT(*) INTO v_team
  FROM public.memberships mm
  WHERE mm.tenant_id = tid
    AND lower(mm.role) IN ('owner','admin','editor');

  INSERT INTO public.tenant_usage(tenant_id, clients_count, team_count, updated_at)
  VALUES (tid, COALESCE(v_clients, 0), GREATEST(COALESCE(v_team, 0), 1), now())
  ON CONFLICT (tenant_id) DO UPDATE
    SET clients_count = EXCLUDED.clients_count,
        team_count = EXCLUDED.team_count,
        updated_at = now();
END;
$$;

-- Trigger to call recount on memberships mutations
CREATE OR REPLACE FUNCTION public._tg_memberships_recount()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.recount_tenant_usage(NEW.tenant_id);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
      PERFORM public.recount_tenant_usage(OLD.tenant_id);
    END IF;
    PERFORM public.recount_tenant_usage(NEW.tenant_id);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.recount_tenant_usage(OLD.tenant_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS trg_memberships_recount ON public.memberships;
  CREATE TRIGGER trg_memberships_recount
    AFTER INSERT OR UPDATE OR DELETE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION public._tg_memberships_recount();
END $$;

-- Backfill tenant_usage rows for existing tenants
INSERT INTO public.tenant_usage(tenant_id, clients_count, team_count, updated_at)
SELECT t.id,
  COALESCE((SELECT COUNT(*) FROM public.memberships m WHERE m.tenant_id = t.id AND lower(m.role) IN ('member','client','jobseeker','recruitpro','role1','role2','role3')), 0) as clients_count,
  GREATEST(COALESCE((SELECT COUNT(*) FROM public.memberships m2 WHERE m2.tenant_id = t.id AND lower(m2.role) IN ('owner','admin','editor')), 0), 1) as team_count,
  now()
FROM public.tenants t
ON CONFLICT (tenant_id) DO NOTHING;


