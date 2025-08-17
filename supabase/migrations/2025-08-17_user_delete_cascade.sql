-- Harden FKs so user deletions don't fail with 23503
begin;

-- A) Pre-clean existing orphaned rows so constraints can be created safely
-- A1) files: null out any user_id whose user no longer exists
update public.files f
set user_id = null
where user_id is not null
  and not exists (select 1 from public.users u where u.id = f.user_id);

-- A2) memberships: delete rows whose user no longer exists
delete from public.memberships m
where not exists (select 1 from public.users u where u.id = m.user_id);

-- A3) profiles: delete rows whose user no longer exists
delete from public.profiles p
where not exists (select 1 from public.users u where u.id = p.id);

-- 1) files.user_id → users.id ON DELETE SET NULL (keep files, drop ownership)
alter table if exists public.files
  drop constraint if exists files_user_id_fkey;

alter table if exists public.files
  add constraint files_user_id_fkey
  foreign key (user_id) references public.users(id)
  on delete set null;

-- 2) profiles.id → users.id ON DELETE CASCADE (remove profile automatically)
alter table if exists public.profiles
  drop constraint if exists profiles_id_fkey;

alter table if exists public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references public.users(id)
  on delete cascade;

-- 3) memberships.user_id → users.id ON DELETE CASCADE (cleanup memberships)
alter table if exists public.memberships
  drop constraint if exists memberships_user_id_fkey;

alter table if exists public.memberships
  add constraint memberships_user_id_fkey
  foreign key (user_id) references public.users(id)
  on delete cascade;

commit;


