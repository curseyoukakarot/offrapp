-- Ensure public.users.id -> auth.users.id allows deleting auth user without 23503
begin;

-- Clean up orphaned app users whose auth.user no longer exists
delete from public.users u
where not exists (select 1 from auth.users a where a.id = u.id);

-- Recreate FK with ON DELETE CASCADE
alter table if exists public.users
  drop constraint if exists users_id_fkey;

alter table if exists public.users
  add constraint users_id_fkey
  foreign key (id) references auth.users(id)
  on delete cascade;

commit;


