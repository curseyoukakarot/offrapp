-- Tenant custom domains
create extension if not exists pgcrypto;

-- Table
do $$ begin
  create table if not exists public.tenant_domains (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    domain text not null unique,
    type text not null check (type in ('apex','sub')),
    txt_token text not null,
    verified_at timestamptz,
    ssl_status text default 'pending',
    created_at timestamptz default now()
  );
exception when others then null; end $$;

-- Indexes
create index if not exists idx_tenant_domains_tenant_id on public.tenant_domains(tenant_id);
create index if not exists idx_tenant_domains_verified_at on public.tenant_domains(verified_at);

-- RLS
alter table public.tenant_domains enable row level security;

-- Policies (idempotent)
drop policy if exists tenant_domains_select_same_tenant on public.tenant_domains;
create policy tenant_domains_select_same_tenant on public.tenant_domains
  for select using (
    public.fn_user_is_super_admin(auth.uid())
    or public.fn_user_in_tenant(auth.uid(), tenant_id)
  );

drop policy if exists tenant_domains_modify_admin on public.tenant_domains;
create policy tenant_domains_modify_admin on public.tenant_domains
  for all using (
    public.fn_user_is_super_admin(auth.uid())
    or exists (
      select 1 from public.memberships m
      where m.tenant_id = tenant_domains.tenant_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    public.fn_user_is_super_admin(auth.uid())
    or exists (
      select 1 from public.memberships m
      where m.tenant_id = tenant_domains.tenant_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );


