-- Mirror auth.users into public.app_users without writing a role (avoids CHECK constraints)
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique not null,
  name text,
  status text not null default 'active' check (status in ('active','pending','disabled')),
  created_at timestamptz not null default now()
);

create or replace function public.fn_sync_auth_user_to_app_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.app_users (id, email, name, status)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null), 'active')
    on conflict (id) do update
      set email = excluded.email,
          name  = excluded.name;
    return new;
  elsif (tg_op = 'UPDATE') then
    update public.app_users
       set email = new.email,
           name  = coalesce(new.raw_user_meta_data->>'full_name', public.app_users.name)
     where id = new.id;
    return new;
  elsif (tg_op = 'DELETE') then
    delete from public.app_users where id = old.id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_sync_auth_user_to_app_users on auth.users;
create trigger trg_sync_auth_user_to_app_users
after insert or update or delete on auth.users
for each row execute function public.fn_sync_auth_user_to_app_users();


