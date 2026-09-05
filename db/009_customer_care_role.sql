-- ============================================================================
-- SciFi Networks — 009: customer_care role
-- ============================================================================

-- app_role is a Postgres enum — adding a value requires ALTER TYPE, and it
-- must run outside any transaction block that also uses the new value in
-- the same transaction (Postgres restriction), which is why this is its
-- own migration file rather than folded into 008.
alter type app_role add value if not exists 'customer_care';

-- Customer Care gets the same site-scoped access as other front-line staff
-- roles (view customers/tickets/installations at their own site, add
-- updates, etc.) — this function is what every relevant RLS policy in
-- 002_rls.sql calls, so updating it here retroactively extends that access
-- to the new role without touching any individual policy.
create or replace function is_site_scoped_staff() returns boolean as $$
  select auth_role() in ('site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff', 'customer_care');
$$ language sql stable;
