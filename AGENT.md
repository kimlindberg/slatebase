# slatebase — Agent Context

## 1. Product intent

Slatebase is a platform for service professionals (initially personal trainers) to run their business.

Core capabilities:
- Admin interface for managing customers, scheduling, bookings, invoices, and settings
- Public-facing scheduling / availability pages for customers
- Integrated booking requests (initially via WhatsApp)
- API and business logic live inside the same SvelteKit app for now

The calendar is part of **Scheduling**, not the entire product.

---

## 2. Technology stack (current)

- SvelteKit + TypeScript
- shadcn-svelte + Tailwind for all admin UI
- Tabler Icons (`@tabler/icons-svelte`) for all icons
- Supabase for authentication and Postgres
- Supabase SSR via `@supabase/ssr`

### UI rules
- Always use shadcn components when available
- Keep admin UI visually consistent (no custom one-off components unless necessary)

---

## 3. Repository structure & routing (CRITICAL)

### Route groups (SvelteKit)
- Route groups `(…)` are for organization only and **do not appear in URLs**
- `(admin)` routes are protected
- `(auth)` routes are public authentication flows

### Intended routing structure

#### Public
- `/`
  - `src/routes/+page.svelte` (public landing page)

#### Admin app
- `/app`
  - `src/routes/app/(admin)/+layout.server.ts` (auth guard)
  - `src/routes/app/(admin)/+layout.svelte` (admin shell)
  - `src/routes/app/(admin)/+page.svelte` → `/app`
  - `src/routes/app/(admin)/customers/+page.svelte` → `/app/customers`

#### Auth
- `/login`
  - `src/routes/(auth)/login/+page.svelte`
- `/register`
  - `src/routes/(auth)/register/+page.svelte`

### Hard routing rules
- ❌ Never have both:
  - `src/routes/+page.svelte`
  - `src/routes/(admin)/+page.svelte`
- `(admin)` must always be nested under a real URL segment (e.g. `/app`)
- Public routes must never perform admin auth checks
- All admin auth checks live in:
  - `src/routes/app/(admin)/+layout.server.ts`

---

## 4. Supabase configuration

### Environment variables
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

### Supabase clients
- Browser client:
  - `src/lib/supabase/browser.ts`
- Server client:
  - `src/lib/server/supabase/server.ts`
  - Must always set a default cookie path (`path: '/'`)

---

## 5. Backend separation rules (CRITICAL)

Slatebase strictly separates **domain logic**, **page controllers**, and **HTTP APIs**.

### 5.1 `src/lib/server/**` — Domain & infrastructure (THE PRODUCT)

- Contains all business logic and data access
- Never reachable over HTTP
- Must be reusable without SvelteKit
- Examples:
  - availability computation
  - scheduling rules
  - booking validation
  - customer and invoice logic
  - DB repositories
  - external integrations (Stripe, CalDAV, Supabase admin)

**Hard rule:**  
No UI, request, or response handling logic is allowed here.

---

### 5.2 `+page.server.ts` — Page controllers (ADMIN / UI)

- Page-scoped server logic only
- Responsibilities:
  - loading data for a specific page
  - handling form `actions`
  - redirects and page-level authorization
- Must call domain logic from `lib/server`
- Must remain thin

**Rule of thumb:**  
If the logic only exists to support one page, it belongs here.

---

### 5.3 `src/routes/api/**/+server.ts` — HTTP APIs (PUBLIC SURFACE)

- Defines HTTP endpoints callable by:
  - browsers
  - public users
  - webhooks
  - cron jobs
  - future mobile apps
- Responsibilities:
  - request parsing
  - authentication / authorization
  - validation
  - calling domain services
  - formatting HTTP responses

**Hard rule:**  
No business logic is allowed in API routes.

---

### 5.4 Decision rubric

Ask:

1. Is this logic reusable outside a single page?
   → `lib/server`

2. Is this logic tied to rendering or submitting one page?
   → `+page.server.ts`

3. Does this need to be callable over HTTP?
   → `routes/api`

If unsure, default to `lib/server`.

---

### 5.5 Prohibited patterns

❌ Business logic inside `routes/api`  
❌ Database queries inside `+page.svelte`  
❌ Domain rules inside UI components  
❌ HTTP concerns leaking into `lib/server`

Violations should be refactored immediately.

---

## 6. UX conventions (admin UI)

For dashboard forms:
- Disable submit until required fields are valid
- Show spinner inside the submit button while submitting
- Show success message to the right of the button (no layout shift)
- Fade success message out after ~2s
- Prefer enhanced forms:
  - `use:enhance`
  - `update({ reset: false })` to avoid clearing inputs
- Use Tabler icons (e.g. `loader-2`) for spinners

---

## 7. SvelteKit / Svelte 5 gotchas

- Svelte 5 uses `onclick={...}`, not `on:click`, for component events
- Keep business logic out of routes and components

---

## 8. Immediate priorities

1) Finish login & register pages (shadcn style)
2) Add admin shell layout (sidebar + header)
3) Add logout endpoint and “Sign out” button
4) Add protected admin landing page

---

## 9. Git commit conventions

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
`wip`, `fix stuff`, `misc`, jokes, emojis, or multi-feature commits