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
- `/wp-admin/sites` — full CRUD: create sites, edit name/description/network
  status, toggle active/disabled, assign a manager (server-verified to hold
  an eligible role before the assignment is allowed). Site detail page shows
  staff, customer count, and open tickets per site.
- `/wp-admin/packages` — full CRUD: create/edit packages, set price/speed/
  duration/features, choose which sites each package is available at, and
  archive (rather than delete) packages that are no longer offered.
- `/wp-admin/customers` — debounced search by name/phone/email, detail view
  per customer with installation/ticket/payment history, and a suspend/
  reactivate action gated behind a confirmation dialog.
- `/wp-admin/agents` — create agents in one step (customer record + login
  credentials + agent profile). Initial password is the phone number,
  `must_change_password` is set automatically. Disable/reactivate in place.
- `/wp-admin/staff` — create staff accounts with a real Supabase Auth login,
  a generated temporary password shown once on screen, role + site
  assignment editable inline. The route handler explicitly refuses to edit
  `owner`/`admin` accounts — role escalation isn't possible through this screen.
- `/wp-admin/vouchers` — issue vouchers to active agents, full history list,
  automatically notifies the agent's linked customer record.
- `/wp-admin/audit-logs` — read-only viewer. No edit or delete affordance
  exists anywhere in the UI or API for this table, matching spec section 39.
- `/wp-admin/tickets` — cross-site list with site/status/priority filters,
  detail view with full activity timeline, status/priority/assignee controls,
  and the ability to add either an internal note or a customer-facing update
  (customer-facing ones trigger a notification automatically; internal notes
  never do).
- `/wp-admin/inventory` — cross-site view with low-stock highlighting and the
  ability to add new items at any site. Deliberately does **not** expose
  stock movement actions here — those are recorded by site staff (below) so
  every change is tied to the person and site that actually made it.
- `/wp-admin/reports` — per-site summary table (installations, tickets,
  vouchers) as a starting point for the fuller reporting spec section 53
  describes.

**Staff Portal additions**
- `/staff/tickets` — same detail/notes/status UI as the admin version, but
  every query runs through the session-bound client, so RLS — not
  application code — is what confines a technician to their own site's
  tickets. Assignee dropdown is also scoped to staff at that same site.
- `/staff/inventory` — list, add-item, and the full stock movement action
  set (add/remove/issue/return/transfer/adjust/mark damaged/mark lost),
  backed by `record_inventory_transaction()` (db/005_inventory_function.sql)
  — a single atomic function that locks the row, computes the new balance,
  and writes the audit-trail transaction row together, so concurrent
  updates from two staff members can't corrupt the count.

**Public site fixes**
- `/status` — dedicated network status page (previously only linked to from
  nav/footer with no page behind it), showing per-site status and any active
  incidents pulled from `network_outages`.
- Favicon and Apple touch icon are now generated (`app/icon.tsx`,
  `app/apple-icon.tsx`) instead of missing entirely.
- `public/manifest.json` was referenced in `layout.tsx` metadata but never
  created — added, so the PWA manifest 404 is gone.
- The homepage hero now leads with the actual tagline ("A network that
  everyone is using but you are not.") instead of just the company name.

**Route protection**
- `middleware.ts` redirects unauthenticated visitors away from `/staff/*` and
  `/wp-admin/*` before any protected UI streams to the client. This is a
  first line of defense, not the only one — RLS and per-page role checks via
  `getAppUserSession()` are what actually enforce authorization.

**Agent Portal (`/track/agent`)**
- `/track/agent` — login (username + password), same lockout/rate-limit model
  as staff login, restricted to `role = 'agent'` only.
- `/track/agent/dashboard` — site info, responsibilities checklist, full
  voucher history with status badges, and the agent's own report history.
  All queries are scoped to the agent record tied to the authenticated user —
  never to a client-supplied ID.
- `/track/agent/report-issue` — outage/equipment/coverage/support reports,
  written through `/api/agents/report-issue`, which re-derives the agent's
  own `site_id`/`agent_id` server-side rather than trusting the request body.

## What's scaffolded but not yet built out

Every section of the spec now has at least a working foundation. What's left
is depth rather than missing pieces:

- **Reports** (`/wp-admin/reports`) currently shows one per-site summary
  table; the spec's fuller list (filterable by date/staff/category, per spec
  section 53) would extend this same page.
- **File uploads** for issue/installation photos (Supabase Storage, private
  bucket, validated MIME/size — RLS placeholders are already in
  `ticket_attachments`).
- **Equipment tracking** (serial numbers, MAC addresses, assignment history)
  — the `equipment` table and its RLS policies exist in the schema but have
  no UI yet.
- **SEO** metadata on About/Contact/FAQ pages (data layer for FAQs already
  exists in `lib/data/public.ts`, but those pages themselves aren't built).
- **Service worker** for true offline fallback on public pages (the manifest
  and icons are in place; the worker itself isn't).
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
4. Run `db/005_inventory_function.sql` as well (adds the atomic stock
   movement function staff inventory actions depend on).
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
