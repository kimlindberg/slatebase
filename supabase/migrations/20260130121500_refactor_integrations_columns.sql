-- Rename integration metadata columns to match schema docs

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'integrations'
      and column_name = 'provider'
  ) then
    execute 'alter table public.integrations rename column provider to integration_type';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'integrations'
      and column_name = 'username'
  ) then
    execute 'alter table public.integrations rename column username to external_username';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'integrations'
      and column_name = 'email'
  ) then
    execute 'alter table public.integrations rename column email to external_email';
  end if;
end $$;

-- Update unique index naming and columns

drop index if exists integrations_user_provider_uq;
create unique index if not exists integrations_user_type_uq
  on public.integrations (user_id, integration_type);
