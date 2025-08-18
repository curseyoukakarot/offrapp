-- Tenant-scoped RLS policies so non-super users only see their tenant data

-- Helper: detect super admin
create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_global_roles r
    where r.user_id = uid and lower(r.role) in ('super_admin','superadmin','super-admin')
  );
$$;

-- Files
alter table if exists public.files enable row level security;
drop policy if exists files_tenant_select on public.files;
create policy files_tenant_select on public.files
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = files.tenant_id and m.user_id = auth.uid()
    )
  );
drop policy if exists files_tenant_write on public.files;
create policy files_tenant_write on public.files
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = files.tenant_id and m.user_id = auth.uid()
    )
  ) with check (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = files.tenant_id and m.user_id = auth.uid()
    )
  );

-- Forms
alter table if exists public.forms enable row level security;
drop policy if exists forms_tenant_select on public.forms;
create policy forms_tenant_select on public.forms
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = forms.tenant_id and m.user_id = auth.uid()
    )
  );
drop policy if exists forms_tenant_write on public.forms;
create policy forms_tenant_write on public.forms
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = forms.tenant_id and m.user_id = auth.uid()
    )
  ) with check (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = forms.tenant_id and m.user_id = auth.uid()
    )
  );

-- Embeds
alter table if exists public.embeds enable row level security;
drop policy if exists embeds_tenant_select on public.embeds;
create policy embeds_tenant_select on public.embeds
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = embeds.tenant_id and m.user_id = auth.uid()
    )
  );
drop policy if exists embeds_tenant_write on public.embeds;
create policy embeds_tenant_write on public.embeds
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = embeds.tenant_id and m.user_id = auth.uid()
    )
  ) with check (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m
      where m.tenant_id = embeds.tenant_id and m.user_id = auth.uid()
    )
  );

-- Users listing (public.users table): allow seeing only users who share a tenant with the requester
alter table if exists public.users enable row level security;
drop policy if exists users_same_tenant_select on public.users;
create policy users_same_tenant_select on public.users
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships m1
      where m1.user_id = auth.uid() and exists (
        select 1 from public.memberships m2
        where m2.user_id = users.id and m2.tenant_id = m1.tenant_id
      )
    )
  );

-- Memberships: admins/owners of a tenant can read/write memberships within that tenant
alter table if exists public.memberships enable row level security;
drop policy if exists mem_select on public.memberships;
create policy mem_select on public.memberships
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships me
      where me.user_id = auth.uid() and me.tenant_id = memberships.tenant_id
    )
  );
drop policy if exists mem_write on public.memberships;
create policy mem_write on public.memberships
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships me
      where me.user_id = auth.uid() and me.tenant_id = memberships.tenant_id and lower(me.role) in ('owner','admin')
    )
  ) with check (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.memberships me
      where me.user_id = auth.uid() and me.tenant_id = memberships.tenant_id and lower(me.role) in ('owner','admin')
    )
  );


