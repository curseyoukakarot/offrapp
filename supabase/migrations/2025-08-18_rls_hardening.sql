-- Multi-tenant hardening: RLS safety net + helpers

-- Helper: detect super admin from app_users.role
create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.app_users au
    where au.id = uid and au.role = 'super_admin'
  );
$$;

-- Composite unique index for memberships (prevent duplicates)
create unique index if not exists ux_memberships_tenant_user
on public.memberships(tenant_id, user_id);

-- Enable RLS on core tenant tables
alter table if exists public.files enable row level security;
alter table if exists public.forms enable row level security;
alter table if exists public.embeds enable row level security;
alter table if exists public.memberships enable row level security;
alter table if exists public.tenant_domains enable row level security;

-- FILES policies
drop policy if exists files_read_as_member on public.files;
create policy files_read_as_member
on public.files
for select
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = files.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists files_write_as_member on public.files;
create policy files_write_as_member
on public.files
for insert
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = files.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists files_update_as_member on public.files;
create policy files_update_as_member
on public.files
for update
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = files.tenant_id
      and m.user_id = auth.uid()
  )
)
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = files.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists files_delete_as_member on public.files;
create policy files_delete_as_member
on public.files
for delete
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = files.tenant_id
      and m.user_id = auth.uid()
  )
);

-- FORMS policies
drop policy if exists forms_read_as_member on public.forms;
create policy forms_read_as_member
on public.forms
for select
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = forms.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists forms_write_as_member on public.forms;
create policy forms_write_as_member
on public.forms
for insert
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = forms.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists forms_update_as_member on public.forms;
create policy forms_update_as_member
on public.forms
for update
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = forms.tenant_id
      and m.user_id = auth.uid()
  )
)
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = forms.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists forms_delete_as_member on public.forms;
create policy forms_delete_as_member
on public.forms
for delete
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = forms.tenant_id
      and m.user_id = auth.uid()
  )
);

-- EMBEDS policies
drop policy if exists embeds_read_as_member on public.embeds;
create policy embeds_read_as_member
on public.embeds
for select
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = embeds.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists embeds_write_as_member on public.embeds;
create policy embeds_write_as_member
on public.embeds
for insert
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = embeds.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists embeds_update_as_member on public.embeds;
create policy embeds_update_as_member
on public.embeds
for update
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = embeds.tenant_id
      and m.user_id = auth.uid()
  )
)
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = embeds.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists embeds_delete_as_member on public.embeds;
create policy embeds_delete_as_member
on public.embeds
for delete
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = embeds.tenant_id
      and m.user_id = auth.uid()
  )
);

-- MEMBERSHIPS policies (users can see their own memberships; super admin sees all)
drop policy if exists memberships_self_read on public.memberships;
create policy memberships_self_read
on public.memberships
for select
using (
  public.is_super_admin(auth.uid()) OR user_id = auth.uid()
);

drop policy if exists memberships_admin_write on public.memberships;
create policy memberships_admin_write
on public.memberships
for all
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = memberships.tenant_id
      and m.user_id = auth.uid()
      and lower(m.role) in ('owner','admin')
  )
)
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = memberships.tenant_id
      and m.user_id = auth.uid()
      and lower(m.role) in ('owner','admin')
  )
);

-- TENANT_DOMAINS policies
drop policy if exists tenant_domains_read_as_member on public.tenant_domains;
create policy tenant_domains_read_as_member
on public.tenant_domains
for select
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = tenant_domains.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists tenant_domains_write_as_member on public.tenant_domains;
create policy tenant_domains_write_as_member
on public.tenant_domains
for all
using (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = tenant_domains.tenant_id
      and m.user_id = auth.uid()
      and lower(m.role) in ('owner','admin')
  )
)
with check (
  public.is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.memberships m
    where m.tenant_id = tenant_domains.tenant_id
      and m.user_id = auth.uid()
      and lower(m.role) in ('owner','admin')
  )
);
