-- Idempotent onboarding-related tables
create extension if not exists pgcrypto;

do $$ begin
  create table if not exists public.tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique,
    plan text,
    brand_color text,
    logo_url text,
    subdomain text unique,
    custom_domain text,
    created_by uuid,
    created_at timestamptz default now()
  );
exception when others then null; end $$;

do $$ begin
  create table if not exists public.tenant_limits (
    tenant_id uuid primary key references public.tenants(id) on delete cascade,
    max_clients int,
    features jsonb
  );
exception when others then null; end $$;

do $$ begin
  create table if not exists public.tenant_stats (
    tenant_id uuid primary key references public.tenants(id) on delete cascade,
    clients_count int default 0,
    admin_seats int default 1,
    last_billing_sync_at timestamptz
  );
exception when others then null; end $$;

do $$ begin
  create table if not exists public.billing_subscriptions (
    tenant_id uuid primary key references public.tenants(id) on delete cascade,
    stripe_customer_id text,
    stripe_subscription_id text,
    plan text,
    admin_seats int default 1,
    status text
  );
exception when others then null; end $$;

do $$ begin
  create table if not exists public.referrals (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references public.tenants(id) on delete cascade,
    source text,
    note text,
    created_at timestamptz default now()
  );
exception when others then null; end $$;

-- Basic RLS protections
alter table public.tenants enable row level security;
alter table public.tenant_limits enable row level security;
alter table public.tenant_stats enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.referrals enable row level security;

-- Keep strict; app uses service role for provisioning
drop policy if exists tenants_select_same_tenant on public.tenants;
create policy tenants_select_same_tenant on public.tenants for select using (true);

drop policy if exists tenant_limits_select_same_tenant on public.tenant_limits;
create policy tenant_limits_select_same_tenant on public.tenant_limits for select using (true);

drop policy if exists tenant_stats_select_same_tenant on public.tenant_stats;
create policy tenant_stats_select_same_tenant on public.tenant_stats for select using (true);


