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

## What's scaffolded but not yet built out

The spec covers 66 sections; this pass builds the database and the customer-facing
half end-to-end, since that's what most depends on getting the schema and auth
model right. Still to build on this foundation:

- **Agent login + dashboard** (`/track/agent`) — schema and RLS already support
  it (`agents` table, `app_users.role = 'agent'`); needs the login form,
  forced-password-change flow, and voucher-history view.
- **Staff portal** (`/staff`) — role-based dashboards per staff role, ticket
  assignment, inventory actions, installation handling.
- **Admin portal** (`/wp-admin`) — the owner console: sites, staff, customers,
  agents, packages, vouchers, inventory, reports, audit log viewer. Needs
  Supabase Auth wired up with custom JWT claims (`role`, `site_id`) so the
  `auth_role()` / `auth_site_id()` functions in `002_rls.sql` resolve correctly.
- **File uploads** for issue/installation photos (Supabase Storage, private
  bucket, validated MIME/size — RLS placeholders are already in
  `ticket_attachments`).
- **PWA** manifest/service worker, **SEO** metadata on remaining pages,
  **About/Contact/FAQ/Status** pages (data layer for FAQs and outages already
  exists in `lib/data/public.ts`).

## Setup

1. Create a Supabase project.
2. Run `db/001_schema.sql`, then `db/002_rls.sql`, then `db/003_seed.sql` in
   the SQL editor, in that order.
3. Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key,
   service role key, and a random `SESSION_SECRET`.
4. Set up a Supabase Auth **custom access token hook** that copies
   `role` and `site_id` from `app_users` into the JWT's `app_metadata` —
   this is what `auth_role()`/`auth_site_id()` in the RLS policies read.
5. `npm install`
6. `npm run dev`

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
