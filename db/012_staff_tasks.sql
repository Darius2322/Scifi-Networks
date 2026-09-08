-- ============================================================================
-- SciFi Networks — 012: staff_tasks table
--
-- Run this AFTER 011_worker_role.sql (needs the 'worker' enum value to exist
-- as a distinct migration step per Postgres's enum-in-same-transaction rule).
-- ============================================================================

create or replace function is_site_scoped_staff() returns boolean as $$
  select auth_role() in ('site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff', 'customer_care', 'worker');
$$ language sql stable;

create table if not exists staff_tasks (
  id uuid primary key default gen_random_uuid(),
  assigned_to uuid not null references app_users(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table staff_tasks enable row level security;

create policy staff_tasks_read on staff_tasks for select using (
  is_owner_or_admin()
  or assigned_to = auth_user_id()
  or (is_site_scoped_staff() and site_id = auth_site_id())
);

create policy staff_tasks_admin_write on staff_tasks for insert with check (
  is_owner_or_admin() or (auth_role() = 'site_manager' and site_id = auth_site_id())
);

create policy staff_tasks_update on staff_tasks for update using (
  is_owner_or_admin() or assigned_to = auth_user_id() or (auth_role() = 'site_manager' and site_id = auth_site_id())
);

create index idx_staff_tasks_assigned on staff_tasks(assigned_to);
create index idx_staff_tasks_site on staff_tasks(site_id);
