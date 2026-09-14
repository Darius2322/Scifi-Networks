-- ============================================================================
-- SciFi Networks — Core Schema
-- Target: PostgreSQL (Supabase)
-- Run in order: 001_schema.sql -> 002_rls.sql -> 003_seed.sql
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- for fast fuzzy search on tickets/names

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type app_role as enum ('owner', 'admin', 'site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff', 'agent', 'customer');
create type request_status as enum (
  'submitted', 'pending_review', 'approved', 'rejected', 'assigned',
  'scheduled', 'in_progress', 'waiting_customer', 'resolved', 'completed', 'cancelled'
);
create type ticket_type as enum ('installation', 'outage', 'coverage', 'complaint', 'equipment', 'agent_report', 'general_support');
create type ticket_priority as enum ('low', 'normal', 'high', 'critical');
create type voucher_status as enum ('available', 'used', 'expired', 'cancelled');
create type equipment_status as enum ('in_stock', 'assigned', 'installed', 'faulty', 'under_repair', 'lost', 'retired');
create type inventory_action as enum ('add', 'remove', 'issue', 'return', 'transfer', 'adjust', 'mark_damaged', 'mark_lost');
create type outage_status as enum ('investigating', 'identified', 'monitoring', 'resolved');
create type site_network_status as enum ('operational', 'partial_outage', 'major_outage', 'maintenance');

-- ----------------------------------------------------------------------------
-- SITES  (multi-site backbone — every operational table hangs off this)
-- ----------------------------------------------------------------------------
create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,               -- 'Kemera', 'Nyanchwa'
  slug text not null unique,                -- 'kemera', 'nyanchwa'
  description text,
  manager_id uuid,                          -- fk added after staff_profiles exists
  is_active boolean not null default true,
  network_status site_network_status not null default 'operational',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- USERS  (one identity table backing auth for staff/admin/agents)
-- Customers are intentionally NOT full "users" — see customers table + ticket auth.
-- In Supabase this mirrors auth.users; id should match auth.users.id when using Supabase Auth.
-- ----------------------------------------------------------------------------
create table app_users (
  id uuid primary key default gen_random_uuid(), -- = auth.users.id in Supabase
  full_name text not null,
  username text unique,                -- required for staff/admin/agent login
  email text unique,
  phone text unique,
  password_hash text,                  -- only used if not delegating fully to Supabase Auth
  role app_role not null,
  site_id uuid references sites(id) on delete set null,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  last_login_at timestamptz,
  failed_login_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_app_users_site on app_users(site_id);
create index idx_app_users_role on app_users(role);

alter table sites
  add constraint fk_sites_manager foreign key (manager_id) references app_users(id) on delete set null;

-- ----------------------------------------------------------------------------
-- STAFF PROFILES (extends app_users for role/site specific staff metadata)
-- ----------------------------------------------------------------------------
create table staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  employee_code text unique,
  job_title text,
  hired_at date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_staff_profiles_user on staff_profiles(user_id);

-- ----------------------------------------------------------------------------
-- CUSTOMERS  (lightweight — no traditional account; verified via ticket+phone/email)
-- ----------------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  site_id uuid references sites(id) on delete set null,
  estate_area text,
  address_details text,
  is_agent boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_customer_contact check (phone is not null or email is not null)
);

create index idx_customers_site on customers(site_id);
create index idx_customers_phone on customers(phone);
create index idx_customers_email on customers(email);
create index idx_customers_name_trgm on customers using gin (full_name gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- AGENTS  (a customer with extra responsibilities + login credentials)
-- ----------------------------------------------------------------------------
create table agents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  app_user_id uuid unique references app_users(id) on delete set null, -- login identity
  site_id uuid not null references sites(id) on delete restrict,
  physical_location text,
  responsibilities text[] not null default array[
    'Keep router safe',
    'Report network outages',
    'Report damaged equipment',
    'Report suspicious activity',
    'Ensure router location remains accessible'
  ],
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agents_site on agents(site_id);

-- ----------------------------------------------------------------------------
-- PACKAGES  (internet plans)
-- ----------------------------------------------------------------------------
create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  speed_mbps int not null,
  price_kes numeric(10,2) not null,
  duration_days int not null default 30,
  description text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table package_sites (
  package_id uuid not null references packages(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  primary key (package_id, site_id)
);

-- ----------------------------------------------------------------------------
-- INSTALLATIONS  (Get Connected requests)
-- ----------------------------------------------------------------------------
create table installations (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,      -- SCIFI-INS-2026-000241
  customer_id uuid not null references customers(id) on delete cascade,
  site_id uuid not null references sites(id) on delete restrict,
  package_id uuid references packages(id) on delete set null,
  preferred_datetime timestamptz,
  additional_notes text,
  status request_status not null default 'submitted',
  assigned_technician_id uuid references app_users(id) on delete set null,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_installations_site on installations(site_id);
create index idx_installations_customer on installations(customer_id);
create index idx_installations_status on installations(status);
create index idx_installations_ticket_trgm on installations using gin (ticket_number gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- TICKETS  (unifies outage/coverage/complaint/equipment/agent_report/support)
-- ----------------------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,      -- SCIFI-SUP-2026-000112
  type ticket_type not null,
  customer_id uuid references customers(id) on delete set null,
  agent_id uuid references agents(id) on delete set null,
  site_id uuid references sites(id) on delete set null,
  installation_id uuid references installations(id) on delete set null,
  subject text not null,
  description text,
  location_text text,
  priority ticket_priority not null default 'normal',
  status request_status not null default 'submitted',
  assigned_to uuid references app_users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_site on tickets(site_id);
create index idx_tickets_status on tickets(status);
create index idx_tickets_type on tickets(type);
create index idx_tickets_assigned on tickets(assigned_to);
create index idx_tickets_number_trgm on tickets using gin (ticket_number gin_trgm_ops);

create table ticket_updates (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  author_id uuid references app_users(id) on delete set null,
  is_internal boolean not null default false,   -- internal notes vs customer-facing updates
  message text not null,
  created_at timestamptz not null default now()
);

create index idx_ticket_updates_ticket on ticket_updates(ticket_id);

create table ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  storage_path text not null,      -- private bucket path, never a predictable public URL
  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  uploaded_by uuid references app_users(id),
  uploaded_by_customer_id uuid references customers(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- NETWORK OUTAGES  (site-wide announcements, distinct from individual tickets)
-- ----------------------------------------------------------------------------
create table network_outages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  title text not null,
  status outage_status not null default 'investigating',
  affected_area text,
  started_at timestamptz not null default now(),
  expected_resolution_at timestamptz,
  resolved_at timestamptz,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create table outage_updates (
  id uuid primary key default gen_random_uuid(),
  outage_id uuid not null references network_outages(id) on delete cascade,
  message text not null,
  author_id uuid references app_users(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INVENTORY
-- ----------------------------------------------------------------------------
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete restrict,
  name text not null,
  sku text not null unique,
  category text not null,
  unit text not null default 'pcs',      -- 'm', 'pcs', 'box'
  current_stock numeric(12,2) not null default 0,
  minimum_stock numeric(12,2) not null default 0,
  condition text not null default 'good' check (condition in ('good', 'damaged', 'faulty')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_inventory_site on inventory_items(site_id);
create index idx_inventory_low_stock on inventory_items(site_id) where current_stock <= minimum_stock;

create table inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  action inventory_action not null,
  quantity numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  performed_by uuid not null references app_users(id),
  related_installation_id uuid references installations(id) on delete set null,
  related_ticket_id uuid references tickets(id) on delete set null,
  site_id uuid not null references sites(id),
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_inv_txn_item on inventory_transactions(item_id);
create index idx_inv_txn_site on inventory_transactions(site_id);

-- ----------------------------------------------------------------------------
-- EQUIPMENT  (serialized, trackable devices — subset of inventory)
-- ----------------------------------------------------------------------------
create table equipment (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete restrict,
  item_id uuid references inventory_items(id) on delete set null,
  model text not null,
  serial_number text unique,
  mac_address text unique,
  status equipment_status not null default 'in_stock',
  assigned_customer_id uuid references customers(id) on delete set null,
  assigned_staff_id uuid references app_users(id) on delete set null,
  installation_id uuid references installations(id) on delete set null,
  installed_at date,
  condition text not null default 'good',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_equipment_site on equipment(site_id);
create index idx_equipment_status on equipment(status);

-- ----------------------------------------------------------------------------
-- VOUCHERS  (issued to agents)
-- ----------------------------------------------------------------------------
create table vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  agent_id uuid not null references agents(id) on delete cascade,
  site_id uuid not null references sites(id),
  package_id uuid references packages(id),
  value_kes numeric(10,2),
  status voucher_status not null default 'available',
  issued_by uuid not null references app_users(id),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_vouchers_agent on vouchers(agent_id);
create index idx_vouchers_site on vouchers(site_id);
create index idx_vouchers_status on vouchers(status);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS  (in-app; SMS/WhatsApp/email are future adapters over this)
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  app_user_id uuid references app_users(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'general',
  is_read boolean not null default false,
  related_ticket_id uuid references tickets(id) on delete set null,
  related_installation_id uuid references installations(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chk_notification_recipient check (customer_id is not null or app_user_id is not null)
);

create index idx_notifications_customer on notifications(customer_id) where is_read = false;
create index idx_notifications_user on notifications(app_user_id) where is_read = false;

-- ----------------------------------------------------------------------------
-- PAYMENTS  (kept minimal — extend when a payment gateway is wired up)
-- ----------------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  site_id uuid references sites(id),
  package_id uuid references packages(id),
  amount_kes numeric(10,2) not null,
  method text not null default 'mpesa',
  reference text unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index idx_payments_customer on payments(customer_id);

-- ----------------------------------------------------------------------------
-- FAQ / CONTACT MESSAGES / SETTINGS
-- ----------------------------------------------------------------------------
create table faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT LOGS  (append-only; never deletable by ordinary staff — enforced in RLS)
-- ----------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references app_users(id) on delete set null,
  actor_label text,                     -- denormalized snapshot in case actor is later deleted
  action text not null,                 -- e.g. 'voucher.issued', 'customer.updated'
  entity_type text not null,
  entity_id uuid,
  site_id uuid references sites(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_logs_site on audit_logs(site_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array[
    'sites','app_users','customers','agents','packages','installations',
    'tickets','inventory_items','equipment','vouchers'
  ] loop
    execute format('create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Ticket number generator (per-type, per-year sequence)
-- ----------------------------------------------------------------------------
create table ticket_sequences (
  prefix text not null,           -- 'INS', 'SUP', 'OUT', 'COV', 'EQP', 'AGT'
  year int not null,
  last_value int not null default 0,
  primary key (prefix, year)
);

create or replace function next_ticket_number(p_prefix text) returns text as $$
declare
  yr int := extract(year from now());
  v int;
begin
  insert into ticket_sequences(prefix, year, last_value)
  values (p_prefix, yr, 1)
  on conflict (prefix, year) do update set last_value = ticket_sequences.last_value + 1
  returning last_value into v;

  return format('SCIFI-%s-%s-%s', p_prefix, yr, lpad(v::text, 6, '0'));
end;
$$ language plpgsql;
