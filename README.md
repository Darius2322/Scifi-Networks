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

**Public site — now complete**
- `/about`, `/contact` (with a working form → `contact_messages` table),
  `/faq` (grouped by category, sourced from the database) — all previously
  missing, now built with proper metadata for each.
- `app/sitemap.ts` and `app/robots.ts` — dynamic sitemap covering all public
  routes; robots config explicitly disallows crawling `/track`, `/staff`,
  `/wp-admin`, and `/api` (no SEO value, and no reason to invite crawlers
  into anything authenticated).
- `public/sw.js` — a real service worker with offline fallback (`/offline`)
  for public pages only. It deliberately never intercepts `/api`, `/staff`,
  `/wp-admin`, or `/track` — those require a live connection and must not
  appear to work offline when they can't actually authenticate or fetch data.

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

## Round 3 additions (post-launch feature requests)

- **Password show/hide toggles** on every login and change-password form.
- **Fixed a real bug**: every admin list page (staff, agents, tickets, inventory,
  packages, sites, vouchers, audit logs, customers, sites/customers detail)
  was reading through the session-bound Supabase client, making results
  fragile to JWT claim timing (this is very likely why "staff weren't
  showing" even though they existed). All switched to the service-role
  client — the page's own `ADMIN_ROLES` check is still the real gate, this
  just makes the data fetch itself reliable.
- **Theme toggle** (light/dark) in the public site header, persisted to
  `localStorage`. Staff/admin portals intentionally stay light-only for now.
- **Public "Report an Issue"** (`/report-issue`) — no login, no phone number
  required, returns a ticket number. Separate from the authenticated
  `/track/report-issue` flow, rate-limited more tightly since it's fully open.
- **`/wp-admin/installations`** — view every installation request and assign
  status/technician inline; customers get a notification on status change.
- **Richer customer detail** (`/wp-admin/customers/[id]`) — inline edit, pause
  (suspend) vs. hard delete as two distinct actions, joined date shown, and
  for agent-customers: their most recent voucher with a one-click resend.
- **Voucher row actions** — Share (copies the code to clipboard), Resend
  (re-notifies the agent), Cancel (soft-cancels if unused, deletes if it was
  never issued as available).
- **Agent auto-voucher issuance** — admin toggles it on per agent and sets a
  duration (e.g. 30 days). `ensure_agent_voucher()` (a Postgres function,
  `db/006_features.sql`) issues a new voucher automatically once the current
  one expires — checked lazily when the agent's dashboard loads, and
  proactively once daily via Vercel Cron (`vercel.json` →
  `/api/cron/issue-vouchers`). Set a `CRON_SECRET` env var to keep that
  endpoint from being triggered by anyone else.
- **`/wp-admin/analytics`** — most requested packages, most-used inventory
  items, and ticket type breakdown, each as a simple bar list.
- **Hotspot packages** — packages now have a `service_type`
  (home/business/hotspot); a new public `/hotspot` page shows hotspot-only
  packages plus an admin-managed requirements list
  (`/wp-admin/packages` → Hotspot requirements section).
- **Reviews** — public submission form (rate 1-5, leave a comment) on the
  homepage; reviews are unpublished by default and need admin approval at
  `/wp-admin/reviews` before they show publicly.
- **Success animations** — a shared `.animate-success` fade/scale-in class
  applied to every "request submitted" / "report received" confirmation state.

**Run `db/006_features.sql` in Supabase before any of this works** — it adds
the `service_type` column, `hotspot_requirements` and `reviews` tables (with
RLS), the agent auto-issuance columns, and the `ensure_agent_voucher()`
function. Also add a `CRON_SECRET` environment variable (any random string)
and set the same value nowhere else — Vercel Cron sends it automatically
once configured via `vercel.json`.

## Round 4: design system overhaul

- **New color palette** — Deep Navy + Teal, implemented as CSS custom
  properties (`app/globals.css`) that Tailwind's color tokens read from
  (`tailwind.config.ts`). This means `text-ink-950`, `bg-paper-50`,
  `bg-signal-500`, `text-status-good`, etc. automatically resolve to the
  correct light or dark value everywhere in the app — no per-component
  color edits were needed. Light: navy text (#0F172A) on off-white
  (#F8FAFC), teal primary (#0F766E). Dark: near-white text on near-black
  navy (#0B1120), bright teal/cyan primary (#2DD4BF).
- **Fonts** — Manrope (600/700) for headings, Inter for everything else
  (body, forms, dashboards, prices), replacing the earlier serif display face.
- **Fixed the hamburger menu bug**: the icon and logo mark had hardcoded hex
  colors (`stroke="#0B1220"`) instead of theme classes, which meant in dark
  mode the icon rendered a dark color on a dark background — effectively
  invisible even though the menu was technically opening. Both now use
  theme-aware `stroke-ink-950` / `fill-signal-500` classes.
- **Admin sidebar** — regrouped into sections (Dashboard, Operations,
  Business, People, System) matching the standard ISP-admin layout pattern,
  and the sidebar nav and main content area now scroll **independently** —
  a long content page never drags the nav out of view, and vice versa. This
  layout is desktop-only by design; on mobile it falls back to normal
  stacked scrolling so the sidebar can't push content off-screen.
- **Hotspot CTAs** — a "Request Hotspot Service" primary button now sits at
  the top of `/hotspot`, alongside "Report an Issue"; each package button
  reads "Request This Plan" instead of "Get This Plan" for clarity.
- **Report an Issue** styled as a proper bordered button on the homepage
  hero, matching the visual weight of Get Connected / Track My Request.

**Known limitation**: the dark-mode toggle sets `data-theme` on `<html>`,
which is a document-level attribute. If a person toggles dark mode on the
public site and then navigates to `/staff` or `/wp-admin` in the *same
browser tab* without a full page reload, the dark values would apply there
too, even though those portals were designed against the light palette only.
In practice this is a narrow edge case (most people reach staff/admin via a
fresh tab or bookmark), but worth knowing about if a staff dashboard looks
unexpectedly inverted — a page refresh will not fix it since the attribute
persists in memory; logging out and back in, or opening a fresh tab, will.

## Round 5 additions

- **Fixed a real image bug**: the homepage hero photo (and any future
  Unsplash images) was silently blocked because `next.config.js` only
  allowed `*.supabase.co` in `images.remotePatterns` — Next.js refuses to
  render external images from domains not explicitly listed. Added
  `images.unsplash.com`. This is very likely why the hero showed a gray box
  instead of a photo.
- **Custom 404 page** (`app/not-found.tsx`), styled consistently with the site.
- **Admin sidebar is now a proper mobile drawer**, not nav dumped inline
  above the page content — Staff and every other section stay reachable
  from a hamburger toggle on any screen size, and the drawer closes
  automatically after navigating.
- **Global admin search** — a search bar in the admin header queries
  customers, tickets, staff, inventory, vouchers, and sites at once, with
  results linking straight to the right page.
- **Site detail quick actions** — clicking into a site (e.g. Nyanchwa) now
  shows View Customers / Tickets / Inventory / Installations buttons plus
  "Add staff to this site", alongside expanded stats (inventory item count,
  pending installations).
- **Main warehouse inventory model**: a site can be flagged "main warehouse"
  (toggle in Site Settings). Stock gets added there first, then moved to
  other sites via a new "Transfer to site" action on each inventory row.
  `transfer_inventory_stock()` (`db/007_inventory_transfer.sql`) moves stock
  atomically — deducting from source and crediting the destination (creating
  the destination item by matching SKU if it doesn't exist yet) — with a
  transaction record written on both ends.
- **Settings page** (`/wp-admin/settings`) — company contact info (phone/
  email/WhatsApp), social media links, Terms & Conditions, and Privacy
  Policy, all editable from the admin and reflected live on the public site:
  Contact page now shows the real numbers/email instead of placeholders, the
  footer shows real social icons when configured, and there's a new public
  `/terms` page.
- **Share button** in the footer — uses the native share sheet on mobile,
  falls back to copying the link on desktop.

Run `db/007_inventory_transfer.sql` in Supabase before using the warehouse
transfer feature.

## What's scaffolded but not yet built out

Every section of the spec now has at least a working foundation, and the
public site is fully built out. What remains is genuinely secondary:

- **File uploads** for issue/installation photos (Supabase Storage, private
  bucket, validated MIME/size — RLS placeholders are already in
  `ticket_attachments`).
- **Equipment tracking** (serial numbers, MAC addresses, assignment history)
  — the `equipment` table and its RLS policies exist in the schema but have
  no UI yet.
- **Reports** (`/wp-admin/reports`) currently shows one per-site summary
  table; the spec's fuller filterable version (by date/staff/category, per
  spec section 53) would extend this same page.
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
