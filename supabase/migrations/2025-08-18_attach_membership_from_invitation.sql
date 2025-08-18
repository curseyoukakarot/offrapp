-- Auto-attach membership to a tenant when a matching pending invitation exists by email
-- Requires tables: invitations(email, tenant_id, role, status, created_at), memberships(tenant_id,user_id,role,status)

create or replace function public.fn_attach_membership_from_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  select * into inv
  from public.invitations
  where status = 'pending' and lower(email) = lower(new.email)
  order by created_at desc
  limit 1;

  if inv is not null then
    insert into public.memberships (tenant_id, user_id, role, status)
    values (inv.tenant_id, new.id, inv.role, 'active')
    on conflict (tenant_id, user_id) do update set role = excluded.role;

    update public.invitations
       set status = 'accepted'
     where id = inv.id;
  end if;

  return new;
end $$;

drop trigger if exists trg_attach_membership_from_invitation on auth.users;
create trigger trg_attach_membership_from_invitation
after insert on auth.users
for each row execute function public.fn_attach_membership_from_invitation();


