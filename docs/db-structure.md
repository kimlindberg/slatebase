# Database structure (from migrations)

This summary is derived from the SQL migrations in `supabase/migrations`.

## Extensions

- pgcrypto (for `gen_random_uuid()`)

## Tables

### public.integrations

Represents a connected external service (e.g. iCloud/CalDAV). Stores metadata only.

- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users(id) on delete cascade
- integration_type text not null -- e.g. 'icloud', 'google', 'stripe'
- label text
- status text not null default 'active' -- active|disabled|error
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- external_username text
- external_email text

Indexes

- integrations_user_id_idx on (user_id)
- integrations_user_type_uq unique on (user_id, integration_type)

Triggers

- integrations_touch: before update, calls public.touch_updated_at()

RLS policies

- select: auth.uid() = user_id
- insert: auth.uid() = user_id
- update: auth.uid() = user_id
- delete: auth.uid() = user_id

### public.integration_secrets

Stores sensitive credentials/config for an integration. Separated from `integrations` on purpose.

- integration_id uuid primary key references public.integrations(id) on delete cascade
- user_id uuid not null references auth.users(id) on delete cascade
- secret jsonb not null
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Indexes

- integration_secrets_user_id_idx on (user_id)

Triggers

- integration_secrets_owner: before insert or update, calls public.enforce_integration_owner()
- integration_secrets_touch: before update, calls public.touch_updated_at()

RLS policies

- select: auth.uid() = user_id
- insert: auth.uid() = user_id
- update: auth.uid() = user_id
- delete: auth.uid() = user_id

### public.providers

Represents the service provider “business identity” in the platform. Today it’s 1:1 with user, but modeled separately to support future expansion.

- id uuid primary key default gen_random_uuid()
- owner_user_id uuid not null references auth.users(id) on delete cascade
- public_slug text -- unique identifier for public pages (e.g. /c/{public_slug}); may be null initially
- is_public boolean not null default false
- timezone text not null default 'Asia/Dubai'
- settings jsonb not null default '{}'::jsonb
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Indexes

- providers_owner_user_id_uq unique on (owner_user_id)
- providers_public_slug_uq unique on (public_slug)

Triggers

- providers_touch: before update, calls public.touch_updated_at()

RLS policies

- select: auth.uid() = owner_user_id
- insert: auth.uid() = owner_user_id
- update: auth.uid() = owner_user_id
- delete: auth.uid() = owner_user_id

## Functions

- public.enforce_integration_owner()
  - Ensures integration_secrets.user_id matches integrations.user_id for the integration_id.
  - Fills user_id on integration_secrets insert when missing.

- public.touch_updated_at()
  - Sets updated_at to now().

## Notes on data movement

- After `providers` is created, a backfill inserts a providers row for each `integrations.user_id`.
- If `integrations.selected_calendar_ids` existed, it is copied into `providers.settings` at:
  - settings.calendar.selectedCalendarIds
- integrations.selected_calendar_ids is then dropped.

## Settings storage examples

These examples show how public.providers.settings stores grouped settings by feature.

Example: scheduling + WhatsApp + calendar selection

```json
{
	"workingHours": {
		"timezone": "Asia/Dubai",
		"days": [1, 2, 3, 4, 5],
		"start": "09:00",
		"end": "17:00"
	},
	"whatsapp": {
		"enabled": true,
		"phoneE164": "+971500000000",
		"messageTemplate": "Hi! Can I book {date} at {time}?"
	},
	"calendar": {
		"selectedCalendarIds": [
			"https://caldav.icloud.com/123456789/calendars/home/",
			"https://caldav.icloud.com/123456789/calendars/work/"
		]
	}
}
```

Example: minimal settings payload

```json
{
	"workingHours": {
		"timezone": "Asia/Dubai",
		"days": [1, 2, 3, 4, 5],
		"start": "08:30",
		"end": "15:00"
	}
}
```

Example: full user snapshot (row-level)

```json
{
	"integrations": {
		"id": "f6b0f2b0-4c0b-4a6d-8c2e-28f66cf0a2f6",
		"user_id": "4b0b4f0e-7d8e-4c3a-8cf1-1b3a5f7b2a10",
		"integration_type": "icloud",
		"label": "Personal iCloud",
		"status": "active",
		"created_at": "2026-01-30T10:14:12.000Z",
		"updated_at": "2026-01-30T10:14:12.000Z",
		"external_username": "trainer@example.com",
		"external_email": "trainer@example.com"
	},
	"integration_secrets": {
		"integration_id": "f6b0f2b0-4c0b-4a6d-8c2e-28f66cf0a2f6",
		"user_id": "4b0b4f0e-7d8e-4c3a-8cf1-1b3a5f7b2a10",
		"secret": {
			"ciphertext": "<encrypted>",
			"iv": "<iv>",
			"tag": "<tag>"
		},
		"created_at": "2026-01-30T10:14:12.000Z",
		"updated_at": "2026-01-30T10:14:12.000Z"
	},
	"providers": {
		"id": "6b6b1f7f-5b3d-4a2a-a2bd-0f8a3a2d4c21",
		"owner_user_id": "4b0b4f0e-7d8e-4c3a-8cf1-1b3a5f7b2a10",
		"public_slug": "kimlindberg",
		"is_public": true,
		"timezone": "Asia/Dubai",
		"settings": {
			"workingHours": {
				"timezone": "Asia/Dubai",
				"days": [1, 2, 3, 4, 5],
				"start": "09:00",
				"end": "17:00"
			},
			"whatsapp": {
				"enabled": true,
				"phoneE164": "+971500000000",
				"messageTemplate": "Hi! Can I book {date} at {time}?"
			},
			"calendar": {
				"selectedCalendarIds": [
					"https://caldav.icloud.com/123456789/calendars/home/",
					"https://caldav.icloud.com/123456789/calendars/work/"
				]
			}
		},
		"created_at": "2026-01-30T10:14:12.000Z",
		"updated_at": "2026-01-30T10:14:12.000Z"
	}
}
```

---

### Notes on intentional changes from the original draft

- Renamed integrations.provider to integrations.integration_type to avoid collision with the providers table.
- Renamed providers.user_id to providers.owner_user_id to make ownership explicit and future-proof.
- Added stable provider columns: public_slug, is_public, and timezone.
- Clarified that integration_secrets is intentionally separated for sensitive data.
- Expanded the settings JSON shape slightly (days, timezone, WhatsApp fields) without enforcing immediate implementation.
