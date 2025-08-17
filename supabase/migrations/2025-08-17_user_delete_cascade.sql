-- Harden FKs so user deletions don't fail with 23503
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


