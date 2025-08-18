-- Add a role column to public.app_users and backfill

alter table if exists public.app_users
  add column if not exists role text
  check (role in ('owner','admin','member','client','recruitpro','jobseeker'))
  default 'client' not null;

-- Optional generic backfill from memberships: if any owner/admin membership, mark as admin
update public.app_users u
set role = 'admin'
where exists (
  select 1 from public.memberships m
  where m.user_id = u.id and lower(m.role) in ('owner','admin')
);

-- Specific backfill for the provided user id
update public.app_users
set role = 'admin'
where id = '60b420df-7ca9-4bcd-bbef-2fce73414b18';


