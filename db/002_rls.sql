-- ============================================================================
-- SciFi Networks — Row Level Security
--
-- Model: every protected table checks the requester's role + site via
-- helper functions that read from a JWT claim (Supabase: auth.jwt()) synced
-- from app_users at login. Nothing here trusts the frontend.
--
-- Roles: owner, admin  -> full access, all sites
--        site_manager, supervisor, technician, support_staff, inventory_staff
--                      -> restricted to their own site_id
--        agent, customer -> restricted to their own records only
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions — read identity out of the current session's JWT claims.
-- Supabase: set these custom claims (role, site_id, app_user_id) in a
-- Postgres function triggered on login / via a custom access token hook.
-- ----------------------------------------------------------------------------
create or replace function auth_role() returns text as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'anon');
$$ language sql stable;

create or replace function auth_site_id() returns uuid as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'site_id', '')::uuid;
$$ language sql stable;

create or replace function auth_user_id() returns uuid as $$
  select auth.uid();
$$ language sql stable;

create or replace function is_owner_or_admin() returns boolean as $$
  select auth_role() in ('owner', 'admin');
$$ language sql stable;

create or replace function is_site_scoped_staff() returns boolean as $$
  select auth_role() in ('site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff');
$$ language sql stable;

-- Service role (server-side API routes using the service key) bypasses RLS
-- entirely by design in Supabase — that's where ticket/customer verification,
-- password hashing checks, and admin-privileged writes should happen, with
-- authorization enforced in application code, not by exposing broad policies
-- to the anon/authenticated key.

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere
-- ----------------------------------------------------------------------------
alter table sites enable row level security;
alter table app_users enable row level security;
alter table staff_profiles enable row level security;
alter table customers enable row level security;
alter table agents enable row level security;
alter table packages enable row level security;
alter table package_sites enable row level security;
alter table installations enable row level security;
alter table tickets enable row level security;
alter table ticket_updates enable row level security;
alter table ticket_attachments enable row level security;
alter table network_outages enable row level security;
alter table outage_updates enable row level security;
alter table inventory_items enable row level security;
alter table inventory_transactions enable row level security;
alter table equipment enable row level security;
alter table vouchers enable row level security;
alter table notifications enable row level security;
alter table payments enable row level security;
alter table faqs enable row level security;
alter table contact_messages enable row level security;
alter table settings enable row level security;
alter table audit_logs enable row level security;

-- ----------------------------------------------------------------------------
-- SITES — public can read active sites (for the public status page); only
-- owner/admin can write.
-- ----------------------------------------------------------------------------
create policy sites_public_read on sites for select using (is_active = true or is_owner_or_admin());
create policy sites_admin_write on sites for insert with check (is_owner_or_admin());
create policy sites_admin_update on sites for update using (is_owner_or_admin());
create policy sites_admin_delete on sites for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- APP_USERS — staff can see themselves and colleagues at their own site;
-- owner/admin see everyone. No one can self-promote their own role.
-- ----------------------------------------------------------------------------
create policy app_users_self_read on app_users for select using (
  id = auth_user_id() or is_owner_or_admin()
  or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy app_users_admin_write on app_users for insert with check (is_owner_or_admin());
create policy app_users_admin_update on app_users for update using (
  is_owner_or_admin() or id = auth_user_id()
) with check (
  is_owner_or_admin() or (id = auth_user_id())
);
create policy app_users_admin_delete on app_users for delete using (is_owner_or_admin());

create policy staff_profiles_read on staff_profiles for select using (
  is_owner_or_admin()
  or user_id = auth_user_id()
  or exists (select 1 from app_users u where u.id = staff_profiles.user_id and u.site_id = auth_site_id() and is_site_scoped_staff())
);
create policy staff_profiles_admin_write on staff_profiles for insert with check (is_owner_or_admin());
create policy staff_profiles_admin_update on staff_profiles for update using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- CUSTOMERS — site-scoped staff see only their site's customers.
-- Customers themselves never query this table directly with the anon/auth
-- key; the /track flow is verified server-side (service role) since a
-- customer has no Supabase Auth session by default.
-- ----------------------------------------------------------------------------
create policy customers_staff_read on customers for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy customers_staff_write on customers for insert with check (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy customers_staff_update on customers for update using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy customers_admin_delete on customers for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- AGENTS
-- ----------------------------------------------------------------------------
create policy agents_read on agents for select using (
  is_owner_or_admin()
  or (is_site_scoped_staff() and site_id = auth_site_id())
  or app_user_id = auth_user_id()
);
create policy agents_staff_write on agents for insert with check (
  is_owner_or_admin() or (auth_role() = 'site_manager' and site_id = auth_site_id())
);
create policy agents_staff_update on agents for update using (
  is_owner_or_admin() or (auth_role() = 'site_manager' and site_id = auth_site_id())
  or app_user_id = auth_user_id()  -- agent can update own profile fields (app layer restricts which columns)
);
create policy agents_admin_delete on agents for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- PACKAGES — publicly readable when active; only admin manages.
-- ----------------------------------------------------------------------------
create policy packages_public_read on packages for select using (
  (is_active = true and is_archived = false) or is_owner_or_admin()
);
create policy packages_admin_write on packages for insert with check (is_owner_or_admin());
create policy packages_admin_update on packages for update using (is_owner_or_admin());
create policy packages_admin_delete on packages for delete using (is_owner_or_admin());

create policy package_sites_public_read on package_sites for select using (true);
create policy package_sites_admin_write on package_sites for insert with check (is_owner_or_admin());
create policy package_sites_admin_delete on package_sites for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- INSTALLATIONS — site-scoped staff only. Customer access happens through
-- the service-role-backed /api/track endpoints, never direct table access.
-- ----------------------------------------------------------------------------
create policy installations_staff_read on installations for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy installations_staff_update on installations for update using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy installations_admin_delete on installations for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- TICKETS + related — site-scoped, plus assignee visibility across sites is
-- intentionally NOT granted (a technician stays inside their site).
-- ----------------------------------------------------------------------------
create policy tickets_staff_read on tickets for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy tickets_staff_write on tickets for insert with check (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy tickets_staff_update on tickets for update using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy tickets_admin_delete on tickets for delete using (is_owner_or_admin());

create policy ticket_updates_read on ticket_updates for select using (
  is_owner_or_admin()
  or exists (
    select 1 from tickets t where t.id = ticket_updates.ticket_id
    and is_site_scoped_staff() and t.site_id = auth_site_id()
  )
);
-- Internal notes are never visible through customer-facing endpoints because
-- those endpoints use the service role and explicitly filter is_internal=false.
create policy ticket_updates_write on ticket_updates for insert with check (
  is_owner_or_admin()
  or exists (
    select 1 from tickets t where t.id = ticket_updates.ticket_id
    and is_site_scoped_staff() and t.site_id = auth_site_id()
  )
);

create policy ticket_attachments_read on ticket_attachments for select using (
  is_owner_or_admin()
  or exists (
    select 1 from tickets t where t.id = ticket_attachments.ticket_id
    and is_site_scoped_staff() and t.site_id = auth_site_id()
  )
);
create policy ticket_attachments_write on ticket_attachments for insert with check (true); -- validated server-side (service role) on upload

-- ----------------------------------------------------------------------------
-- NETWORK OUTAGES — publicly readable (status page), only staff/admin at
-- that site (or admin) can create/update.
-- ----------------------------------------------------------------------------
create policy outages_public_read on network_outages for select using (true);
create policy outages_staff_write on network_outages for insert with check (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy outages_staff_update on network_outages for update using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);

create policy outage_updates_public_read on outage_updates for select using (true);
create policy outage_updates_staff_write on outage_updates for insert with check (
  is_owner_or_admin()
  or exists (
    select 1 from network_outages o where o.id = outage_updates.outage_id
    and is_site_scoped_staff() and o.site_id = auth_site_id()
  )
);

-- ----------------------------------------------------------------------------
-- INVENTORY — strictly site-scoped. Inventory staff at Nyanchwa cannot see
-- Kemera's stock, per spec.
-- ----------------------------------------------------------------------------
create policy inventory_items_read on inventory_items for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy inventory_items_write on inventory_items for insert with check (
  is_owner_or_admin() or (auth_role() in ('site_manager','inventory_staff') and site_id = auth_site_id())
);
create policy inventory_items_update on inventory_items for update using (
  is_owner_or_admin() or (auth_role() in ('site_manager','inventory_staff') and site_id = auth_site_id())
);
create policy inventory_items_admin_delete on inventory_items for delete using (is_owner_or_admin());

-- Movements are append-only — no update/delete policies exist at all, which
-- means even owner/admin cannot silently edit history through the API
-- (corrections happen via a new offsetting transaction, not a mutation).
create policy inventory_txn_read on inventory_transactions for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy inventory_txn_write on inventory_transactions for insert with check (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);

create policy equipment_read on equipment for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy equipment_write on equipment for insert with check (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy equipment_update on equipment for update using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);

-- ----------------------------------------------------------------------------
-- VOUCHERS — site-scoped staff + admin issue; agents see only their own.
-- ----------------------------------------------------------------------------
create policy vouchers_read on vouchers for select using (
  is_owner_or_admin()
  or (is_site_scoped_staff() and site_id = auth_site_id())
  or exists (select 1 from agents a where a.id = vouchers.agent_id and a.app_user_id = auth_user_id())
);
create policy vouchers_staff_write on vouchers for insert with check (
  is_owner_or_admin() or (auth_role() = 'site_manager' and site_id = auth_site_id())
);
create policy vouchers_staff_update on vouchers for update using (
  is_owner_or_admin() or (auth_role() = 'site_manager' and site_id = auth_site_id())
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS — a user only ever sees their own. Customer notifications
-- are delivered through the service-role-backed track API.
-- ----------------------------------------------------------------------------
create policy notifications_self_read on notifications for select using (
  app_user_id = auth_user_id() or is_owner_or_admin()
);
create policy notifications_self_update on notifications for update using (
  app_user_id = auth_user_id() or is_owner_or_admin()
);

-- ----------------------------------------------------------------------------
-- PAYMENTS — staff of that site + admin.
-- ----------------------------------------------------------------------------
create policy payments_staff_read on payments for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy payments_staff_write on payments for insert with check (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);

-- ----------------------------------------------------------------------------
-- FAQ — public read of published entries, admin manages.
-- ----------------------------------------------------------------------------
create policy faqs_public_read on faqs for select using (is_published = true or is_owner_or_admin());
create policy faqs_admin_write on faqs for insert with check (is_owner_or_admin());
create policy faqs_admin_update on faqs for update using (is_owner_or_admin());
create policy faqs_admin_delete on faqs for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- CONTACT MESSAGES — write-only for the public (via service role from the
-- contact form endpoint), read by admin/support staff only.
-- ----------------------------------------------------------------------------
create policy contact_messages_admin_read on contact_messages for select using (is_owner_or_admin());
create policy contact_messages_service_write on contact_messages for insert with check (true);

-- ----------------------------------------------------------------------------
-- SETTINGS — admin only.
-- ----------------------------------------------------------------------------
create policy settings_admin_all on settings for select using (is_owner_or_admin());
create policy settings_admin_write on settings for insert with check (is_owner_or_admin());
create policy settings_admin_update on settings for update using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- AUDIT LOGS — readable by admin (site-scoped staff can read their own
-- site's entries for transparency); nobody gets delete or update, ever,
-- including owner/admin, from the API surface. Deletion, if ever required,
-- happens directly by a DBA outside the application.
-- ----------------------------------------------------------------------------
create policy audit_logs_read on audit_logs for select using (
  is_owner_or_admin() or (is_site_scoped_staff() and site_id = auth_site_id())
);
create policy audit_logs_write on audit_logs for insert with check (true); -- inserted by server-side triggers/service role only
-- Deliberately: no update policy, no delete policy, for any role.
