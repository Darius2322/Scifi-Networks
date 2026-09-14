-- ============================================================================
-- SciFi Networks — 008: voucher reservation, maintenance notices, auto-routing
-- ============================================================================

-- Vouchers: add a genuine 'reserved' state, distinct from 'available'/'used'.
alter table vouchers add column if not exists reserved_by uuid references app_users(id) on delete set null;
alter table vouchers add column if not exists reserved_at timestamptz;
alter table vouchers add column if not exists reservation_expires_at timestamptz;

-- Widen the status check to include 'reserved' (Postgres requires dropping
-- and recreating a check constraint rather than altering it in place).
alter table vouchers drop constraint if exists vouchers_status_check;
alter table vouchers add constraint vouchers_status_check
  check (status in ('available', 'reserved', 'used', 'expired', 'cancelled'));

-- ----------------------------------------------------------------------------
-- Atomically reserve an available voucher. Row-level lock prevents two staff
-- members from reserving the same voucher at the same time — this is
-- enforced here, in the database, not just in application code.
-- ----------------------------------------------------------------------------
create or replace function reserve_voucher(p_voucher_id uuid, p_reserved_by uuid, p_hold_minutes int default 30)
returns vouchers
security definer
set search_path = public
language plpgsql
as $$
declare
  v_voucher vouchers%rowtype;
begin
  select * into v_voucher from vouchers where id = p_voucher_id for update;
  if not found then
    raise exception 'Voucher not found';
  end if;
  if v_voucher.status != 'available' then
    raise exception 'This voucher is no longer available (currently %)', v_voucher.status;
  end if;

  update vouchers
  set status = 'reserved',
      reserved_by = p_reserved_by,
      reserved_at = now(),
      reservation_expires_at = now() + (p_hold_minutes || ' minutes')::interval
  where id = p_voucher_id
  returning * into v_voucher;

  return v_voucher;
end;
$$;

-- Releases a reservation back to 'available' (manual release, or called by
-- the cron sweep below once a hold expires).
create or replace function release_voucher_reservation(p_voucher_id uuid)
returns vouchers
security definer
set search_path = public
language plpgsql
as $$
declare
  v_voucher vouchers%rowtype;
begin
  update vouchers
  set status = 'available', reserved_by = null, reserved_at = null, reservation_expires_at = null
  where id = p_voucher_id and status = 'reserved'
  returning * into v_voucher;

  return v_voucher;
end;
$$;

-- Sweeps expired reservations back to available — called by a scheduled
-- route, same pattern as the voucher auto-issuance cron.
create or replace function release_expired_voucher_reservations()
returns int
security definer
set search_path = public
language plpgsql
as $$
declare
  v_count int;
begin
  with released as (
    update vouchers
    set status = 'available', reserved_by = null, reserved_at = null, reservation_expires_at = null
    where status = 'reserved' and reservation_expires_at < now()
    returning id
  )
  select count(*) into v_count from released;

  return v_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- Maintenance notices — separate from network_outages (which represent
-- unplanned incidents); these are planned, scheduled announcements.
-- ----------------------------------------------------------------------------
create table if not exists maintenance_notices (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete set null,
  title text not null,
  description text,
  affected_service text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

alter table maintenance_notices enable row level security;
create policy maintenance_public_read on maintenance_notices for select using (is_published = true or is_owner_or_admin());
create policy maintenance_admin_write on maintenance_notices for insert with check (is_owner_or_admin());
create policy maintenance_admin_update on maintenance_notices for update using (is_owner_or_admin());
create policy maintenance_admin_delete on maintenance_notices for delete using (is_owner_or_admin());

-- ----------------------------------------------------------------------------
-- Location-based auto-routing. When a ticket is created for a site, find an
-- active agent assigned to that site and attach them + notify them. Never
-- hardcodes a site->agent mapping — it's a live lookup against `agents`.
-- ----------------------------------------------------------------------------
create or replace function route_ticket_to_agent(p_ticket_id uuid)
returns uuid
security definer
set search_path = public
language plpgsql
as $$
declare
  v_ticket tickets%rowtype;
  v_agent agents%rowtype;
begin
  select * into v_ticket from tickets where id = p_ticket_id;
  if not found or v_ticket.site_id is null then
    return null;
  end if;

  -- Picks the agent with the fewest currently-open tickets at that site, so
  -- load spreads out if a site has more than one active agent.
  select a.* into v_agent
  from agents a
  where a.site_id = v_ticket.site_id and a.status = 'active'
  order by (
    select count(*) from tickets t2
    where t2.agent_id = a.id and t2.status not in ('resolved', 'completed', 'cancelled')
  ) asc
  limit 1;

  if not found then
    return null; -- no active agent at this site — falls through to the admin/support queue
  end if;

  update tickets set agent_id = v_agent.id where id = p_ticket_id;

  if v_agent.app_user_id is not null then
    insert into notifications (app_user_id, title, body, category, related_ticket_id)
    values (v_agent.app_user_id, 'New request routed to you', 'A new ' || v_ticket.type || ' report near your site needs attention.', 'ticket', p_ticket_id);
  end if;

  return v_agent.id;
end;
$$;
