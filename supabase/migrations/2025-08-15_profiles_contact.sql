do $$ begin
  alter table public.profiles add column if not exists phone text;
exception when others then null; end $$;

do $$ begin
  alter table public.profiles add column if not exists linkedin text;
exception when others then null; end $$;


