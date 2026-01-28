-- Enable pgcrypto for gen_random_uuid
create extension if not exists "pgcrypto";

-- Core integrations table
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, -- e.g. 'icloud', 'google'
  label text,
  status text not null default 'active', -- active|disabled|error
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- provider-specific non-secret fields
  username text,
  email text
);

create index if not exists integrations_user_id_idx
  on public.integrations (user_id);

create unique index if not exists integrations_user_provider_uq
  on public.integrations (user_id, provider);

-- Secrets table (1:1)
create table if not exists public.integration_secrets (
  integration_id uuid primary key references public.integrations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  secret jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_secrets_user_id_idx
  on public.integration_secrets (user_id);

-- Ensure user_id matches integration owner
create or replace function public.enforce_integration_owner()
returns trigger as $$
begin
  if (new.user_id is null) then
    new.user_id := (select user_id from public.integrations where id = new.integration_id);
  end if;

  if new.user_id != (select user_id from public.integrations where id = new.integration_id) then
    raise exception 'integration_secrets.user_id must match integrations.user_id';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger integration_secrets_owner
before insert or update on public.integration_secrets
for each row execute procedure public.enforce_integration_owner();

-- Updated-at trigger helper
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger integrations_touch
before update on public.integrations
for each row execute procedure public.touch_updated_at();

create trigger integration_secrets_touch
before update on public.integration_secrets
for each row execute procedure public.touch_updated_at();

-- RLS
alter table public.integrations enable row level security;
alter table public.integration_secrets enable row level security;

create policy "integrations_select_own"
on public.integrations for select
using (auth.uid() = user_id);

create policy "integrations_insert_own"
on public.integrations for insert
with check (auth.uid() = user_id);

create policy "integrations_update_own"
on public.integrations for update
using (auth.uid() = user_id);

create policy "integrations_delete_own"
on public.integrations for delete
using (auth.uid() = user_id);

create policy "secrets_select_own"
on public.integration_secrets for select
using (auth.uid() = user_id);

create policy "secrets_insert_own"
on public.integration_secrets for insert
with check (auth.uid() = user_id);

create policy "secrets_update_own"
on public.integration_secrets for update
using (auth.uid() = user_id);

create policy "secrets_delete_own"
on public.integration_secrets for delete
using (auth.uid() = user_id);
