create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  public_slug text,
  is_public boolean not null default false,
  timezone text not null default 'Asia/Dubai',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists providers_owner_user_id_uq
  on public.providers (owner_user_id);

create unique index if not exists providers_public_slug_uq
  on public.providers (public_slug);

drop trigger if exists providers_touch on public.providers;
create trigger providers_touch
before update on public.providers
for each row execute procedure public.touch_updated_at();

alter table public.providers enable row level security;

create policy "providers_select_own"
on public.providers for select
using (auth.uid() = owner_user_id);

create policy "providers_insert_own"
on public.providers for insert
with check (auth.uid() = owner_user_id);

create policy "providers_update_own"
on public.providers for update
using (auth.uid() = owner_user_id);

create policy "providers_delete_own"
on public.providers for delete
using (auth.uid() = owner_user_id);

insert into public.providers (owner_user_id)
select distinct user_id
from public.integrations
on conflict (owner_user_id) do nothing;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'integrations'
      and column_name = 'selected_calendar_ids'
  ) then
    update public.providers p
    set settings = jsonb_set(
      coalesce(p.settings, '{}'::jsonb),
      '{calendar,selectedCalendarIds}',
      to_jsonb(i.selected_calendar_ids),
      true
    )
    from public.integrations i
    where p.owner_user_id = i.user_id
      and i.selected_calendar_ids is not null;
  end if;
end $$;

alter table public.integrations
  drop column if exists selected_calendar_ids;
