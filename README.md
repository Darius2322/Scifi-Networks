# SciFi Networks

A real Next.js + Supabase (Postgres) application for an ISP: public website,
ticket-based customer tracking, and a foundation for staff/admin portals.

## What's actually working in this pass

**Database (`/db`)** — the full foundation, ready to run against a real Supabase project:
- `001_schema.sql` — every entity from the spec: sites, users/roles, staff, customers,
  agents, packages, installations, tickets + updates + attachments, network outages,
  inventory + transactions, equipment, vouchers, notifications, payments, FAQs,
  contact messages, settings, audit logs. Proper foreign keys, indexes, and an
  atomic per-year ticket-number sequence (`SCIFI-INS-2026-000241` style).
- `002_rls.sql` — Row Level Security enforcing multi-site data isolation and
  role-based access **in the database itself**, not just the UI. A Nyanchwa
  site manager's queries physically cannot return Kemera rows. Audit logs have
  no update/delete policy for any role, on purpose.
- `003_seed.sql` — demo data only (Kemera/Nyanchwa, starter packages, FAQs),
  clearly separated from schema/RLS so it's obvious what's real vs. bootstrap.
- `004_auth_hook.sql` — **must be registered in Supabase Dashboard** under
  Authentication → Hooks → Custom Access Token. Without this, RLS policies
  that check role/site_id will always deny access, because the JWT never
  carries those claims. See setup steps below.

**Public website**
- Home (`/`) — live network-status strip, real sites/packages pulled from the DB
  (nothing hardcoded), agent program callout.
- Packages (`/packages`) — reads from `packages` table.
- Get Connected (`/get-connected`) — full form → `POST /api/installations` →
  generates a real ticket number via the DB sequence function, creates/reuses
  the customer record, writes an audit log entry.

**Customer Track Portal (`/track`)** — the most security-sensitive part of the spec:
- Ticket number **alone** returns nothing. `/api/track/auth` requires a matching
  phone/email, returns a generic error either way (no enumeration), rate-limits
  by IP+ticket, and on success sets an **httpOnly, signed, 2-hour-lived** JWT
  cookie scoped to exactly one installation — never a general session.
- `/track/dashboard` — status timeline (Submitted → Reviewed → Approved →
  Technician Assigned → Scheduled → Completed), ticket history, notifications.
  All data fetching is scoped server-side to the session's `installation_id`;
  internal staff notes are excluded by query, not by hiding them in the UI.
- `/track/report-issue` — customers can raise outage/coverage/equipment/support
  tickets from the dashboard; the installation ID is re-validated server-side
  against the session on every write.

**Staff Portal (`/staff`)**
- `/staff/login` — username-or-email + password, backed by real Supabase Auth
  sign-in (not a custom session scheme), with lockout after 5 failed attempts
  (15-minute lock), generic error messages (no username enumeration), and
  per-IP+identifier rate limiting.
- `/staff/change-password` — forced on first login for any account with
  `must_change_password = true` (agents default to this, since their initial
  password is their phone number per spec).
- `/staff/dashboard` — role-scoped via RLS: new installations, open tickets,
  active outages, low-stock alerts. No owner-level data is queried here at all.

**Admin Portal (`/wp-admin`)**
- `/wp-admin/login` — same security model as staff login, hard-restricted to
  `owner`/`admin` roles only — correct credentials for any other role are
  rejected by this endpoint specifically, not just by the UI.
- `/wp-admin` — cross-site overview: total customers, pending installations,
  open tickets, active agents/sites/staff, inventory alerts, per-site rollups
  with a link into each site's profile, recent voucher activity.

**Route protection**
- `middleware.ts` redirects unauthenticated visitors away from `/staff/*` and
  `/wp-admin/*` before any protected UI streams to the client. This is a
  first line of defense, not the only one — RLS and per-page role checks via
  `getAppUserSession()` are what actually enforce authorization.

## What's scaffolded but not yet built out

The spec covers 66 sections; this pass now covers the database, the full
customer-facing flow, and working authentication for staff/admin/agents.
Still to build on this foundation:

- **Agent dashboard** (`/track/agent/dashboard`) — the login route
  (`/api/agents/login`) and schema already work; needs the login page UI and
  the dashboard itself (voucher history, responsibilities, report-issue).
- **Admin CRUD screens** — `/wp-admin/sites`, `/customers`, `/agents`,
  `/staff`, `/packages`, `/tickets`, `/inventory`, `/vouchers`, `/reports`,
  `/audit-logs` are in the nav but not yet built out individually; the data
  layer pattern in `lib/data/admin.ts` is the template to extend.
- **Staff ticket/inventory action pages** (`/staff/tickets`, `/staff/inventory`)
  — same nav-exists-page-pending state as above.
- **File uploads** for issue/installation photos (Supabase Storage, private
  bucket, validated MIME/size — RLS placeholders are already in
  `ticket_attachments`).
- **PWA** manifest/service worker, **SEO** metadata on remaining pages,
  **About/Contact/FAQ/Status** pages (data layer for FAQs and outages already
  exists in `lib/data/public.ts`).

## Setup

1. Create a Supabase project.
2. Run `db/001_schema.sql`, then `db/002_rls.sql`, then `db/003_seed.sql`,
   then `db/004_auth_hook.sql` in the SQL editor, in that order.
3. **Register the auth hook**: Supabase Dashboard → Authentication → Hooks →
   Custom Access Token → select `public.custom_access_token_hook`. Skipping
   this step means every RLS policy that checks role/site will deny access
   even to legitimate logged-in staff.
4. Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key,
   service role key, and a random `SESSION_SECRET`.
5. Create your first owner account: in Supabase Dashboard → Authentication →
   Users → Add User, create an account with the same email as the seeded
   owner row in `app_users` (or update that row's email to match). Then set
   its password there directly for the first login.
6. `npm install`
7. `npm run dev`

## Why some things are the way they are

- **Service role client is isolated** in `lib/supabase/server.ts` with a
  runtime guard against browser use, and is only called from route handlers
  that do their own explicit authorization (ticket verification, since
  customers have no Supabase Auth session at all).
- **Inventory transactions have no update/delete RLS policy.** Corrections
  happen via a new offsetting transaction, so stock history can never be
  silently edited — matching the spec's "never allow silent changes" requirement.
- **The `/wp-admin` path is just a path.** All real protection is RLS +
  server-side role checks; nothing is gated on the URL being obscure.
