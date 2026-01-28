# slatebase — Agent Context

## Goal
Build a platform for service professionals (initially PTs) with:
- Admin UI (login/register, dashboard modules: customers, bookings, invoices, settings)
- Public calendar page for customers
- API/business logic inside the same SvelteKit app initially

## Tech decisions (current)
- SvelteKit + TypeScript
- shadcn-svelte + Tailwind for UI
- Supabase for auth + Postgres
- Supabase SSR setup using @supabase/ssr
- Always use shadcn components when available to keep the admin UI consistent
- Always use tabler.io icons when applicable

## Current repo conventions
### Route groups (SvelteKit)
- Use route groups like `(admin)` and `(auth)` for organization (not in URL)
- Admin routes guarded by `(admin)/+layout.server.ts`
- Auth routes in `(auth)/login` and `(auth)/register`

### Supabase env vars
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

### Supabase clients
- Browser: `src/lib/supabase/browser.ts`
- Server: `src/lib/server/supabase/server.ts` (cookies.set needs `path: '/'` default)

## Immediate next tasks
1) Finish login/register pages (shadcn style)
2) Add admin shell layout (sidebar + header)
3) Add logout endpoint and “Sign out” button
4) Add basic protected admin landing page

## Notes / gotchas
- Svelte 5 uses `onclick={...}` rather than `on:click` on components
- Keep business logic out of routes: put in `src/lib/server/domain/*`

## Routing rules (IMPORTANT – SvelteKit specifics)

- Route groups `(…)` DO NOT appear in URLs.
- There MUST NOT be both:
  - `src/routes/+page.svelte`
  - `src/routes/(admin)/+page.svelte`
  at the same time (they both map to `/` and will conflict).

### Intended structure

- Public landing page lives at `/`
  - File: `src/routes/+page.svelte`

- Admin app lives under `/app`
  - Folder: `src/routes/app/(admin)/`
  - Example:
    - `src/routes/app/(admin)/+layout.server.ts`
    - `src/routes/app/(admin)/+layout.svelte`
    - `src/routes/app/(admin)/+page.svelte` → `/app`
    - `src/routes/app/(admin)/customers/+page.svelte` → `/app/customers`

- Auth routes live under `/login` and `/register`
  - Folder: `src/routes/(auth)/login/+page.svelte`
  - Folder: `src/routes/(auth)/register/+page.svelte`

### Guarding rules

- All admin auth checks happen in:
  - `src/routes/app/(admin)/+layout.server.ts`
- Public routes MUST NOT perform admin auth checks.

### Hard rule

If adding an `(admin)` route group:
- It MUST be nested under a real URL segment (e.g. `/app`)
- Never directly under `src/routes/`



## Git Commit Messages

### Format
<type>(optional scope): short, imperative summary

Optional body explaining why the change was made.  
Optional footer for issues or breaking changes.

### Types
- feat: new functionality
- fix: bug fix
- refactor: behavior-preserving change
- perf: performance improvement
- test: tests only
- chore: tooling, dependencies, setup
- docs: documentation only

### Rules
- Use imperative mood (`add`, not `added`)
- Keep subject ≤ 50 characters
- No trailing punctuation
- Describe what changed, not what you did
- One logical change per commit

### Body
- Explain why, not how
- Mention constraints or tradeoffs if relevant

### Scope (optional)
Use for larger repos, e.g. `feat(api):`, `fix(ui):`

### Issues
Reference when applicable, e.g. `Closes #123`, `Refs: JIRA-456`

### Initial Commit
`chore: initial commit`

### Avoid
`wip`, `fix stuff`, `misc`, jokes, emojis, or multi-feature commits.
