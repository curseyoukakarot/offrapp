-- Multi-tenant core schema (idempotent)
-- Safe to rerun; no drops; no data loss

-- Ensure pgcrypto for gen_random_uuid (commonly enabled in Supabase)
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- memberships (user ↔ tenant)
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- user_global_roles (e.g., super_admin)
CREATE TABLE IF NOT EXISTS public.user_global_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- tenant_domains (unique domain per tenant)
CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Uniqueness on domain
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'tenant_domains_domain_key'
  ) THEN
    CREATE UNIQUE INDEX tenant_domains_domain_key ON public.tenant_domains (lower(domain));
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);

-- Add tenant_id to tenant-scoped tables (if they exist)
ALTER TABLE IF EXISTS public.forms
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='forms'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_forms_tenant_id'
  ) THEN
    CREATE INDEX idx_forms_tenant_id ON public.forms(tenant_id);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.files
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='files'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_files_tenant_id'
  ) THEN
    CREATE INDEX idx_files_tenant_id ON public.files(tenant_id);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.embeds
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='embeds'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_embeds_tenant_id'
  ) THEN
    CREATE INDEX idx_embeds_tenant_id ON public.embeds(tenant_id);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.dashboards
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dashboards'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_dashboards_tenant_id'
  ) THEN
    CREATE INDEX idx_dashboards_tenant_id ON public.dashboards(tenant_id);
  END IF;
END $$;


