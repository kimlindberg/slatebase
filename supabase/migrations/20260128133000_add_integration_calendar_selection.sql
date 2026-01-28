alter table public.integrations
	add column if not exists selected_calendar_ids text[] default '{}';
