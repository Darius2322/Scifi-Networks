-- ============================================================================
-- SciFi Networks — 006: hotspot packages, auto-voucher issuance, reviews,
-- anonymous issue reporting
-- ============================================================================

-- Packages can now be categorized (drives the public Hotspot section)
alter table packages add column if not exists service_type text not null default 'home'
  check (service_type in ('home', 'business', 'hotspot'));

-- Requirements shown alongside hotspot packages, fully admin-managed
create table if not exists hotspot_requirements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table hotspot_requirements enable row level security;
create policy hotspot_requirements_public_read on hotspot_requirements for select using (is_active = true or is_owner_or_admin());
create policy hotspot_requirements_admin_write on hotspot_requirements for insert with check (is_owner_or_admin());
create policy hotspot_requirements_admin_update on hotspot_requirements for update using (is_owner_or_admin());
create policy hotspot_requirements_admin_delete on hotspot_requirements for delete using (is_owner_or_admin());

-- Auto-issuance settings per agent: admin sets a duration; the system keeps
-- the agent supplied with a voucher automatically until this is turned off.
alter table agents add column if not exists auto_issue_vouchers boolean not null default false;
alter table agents add column if not exists voucher_duration_days int not null default 30;
alter table agents add column if not exists voucher_value_kes numeric(10,2);
alter table agents add column if not exists voucher_package_id uuid references packages(id);

-- Anonymous public issue reports (no customer account, no phone required)
alter table tickets add column if not exists reporter_name text;
alter table tickets add column if not exists reporter_contact text;
alter table tickets alter column customer_id drop not null; -- already nullable, kept explicit for clarity

-- Reviews / testimonials
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  site_id uuid references sites(id) on delete set null,
  name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;
create policy reviews_public_read on reviews for select using (is_published = true or is_owner_or_admin());
create policy reviews_public_write on reviews for insert with check (true); -- unmoderated by default (is_published=false)
create policy reviews_admin_update on reviews for update using (is_owner_or_admin());
create policy reviews_admin_delete on reviews for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- Auto-voucher issuance function.
-- Called lazily (agent dashboard load) and also reachable via a scheduled
-- API route (see vercel.json) for agents who haven't logged in recently.
-- Issues a new voucher only if the agent has none currently 'available' AND
-- auto-issuance is turned on for them.
-- ----------------------------------------------------------------------------
create or replace function ensure_agent_voucher(p_agent_id uuid)
returns vouchers
security definer
set search_path = public
language plpgsql
as $$
declare
  v_agent agents%rowtype;
  v_existing vouchers%rowtype;
  v_new vouchers%rowtype;
  v_code text;
begin
  select * into v_agent from agents where id = p_agent_id and status = 'active';
  if not found or v_agent.auto_issue_vouchers is not true then
    return null;
  end if;

  select * into v_existing from vouchers
  where agent_id = p_agent_id and status = 'available'
    and (expires_at is null or expires_at > now())
  limit 1;

  if found then
    return v_existing;
  end if;

  v_code := 'SCIFI-V-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  insert into vouchers (code, agent_id, site_id, package_id, value_kes, status, issued_by, issued_at, expires_at)
  values (
    v_code, p_agent_id, v_agent.site_id, v_agent.voucher_package_id, v_agent.voucher_value_kes,
    'available', v_agent.created_by, now(), now() + (v_agent.voucher_duration_days || ' days')::interval
  )
  returning * into v_new;

  insert into audit_logs (action, entity_type, entity_id, site_id, metadata)
  values ('voucher.auto_issued', 'voucher', v_new.id, v_agent.site_id, jsonb_build_object('code', v_new.code, 'agent_id', p_agent_id));

  return v_new;
end;
$$;
