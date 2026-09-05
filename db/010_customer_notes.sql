-- ============================================================================
-- SciFi Networks — 010: customer notes for staff/customer care
-- ============================================================================

create table if not exists customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  author_id uuid references app_users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table customer_notes enable row level security;

create policy customer_notes_staff_read on customer_notes for select using (
  is_owner_or_admin()
  or exists (
    select 1 from customers c where c.id = customer_notes.customer_id
    and is_site_scoped_staff() and c.site_id = auth_site_id()
  )
);

create policy customer_notes_staff_write on customer_notes for insert with check (
  is_owner_or_admin()
  or exists (
    select 1 from customers c where c.id = customer_notes.customer_id
    and is_site_scoped_staff() and c.site_id = auth_site_id()
  )
);

create index idx_customer_notes_customer on customer_notes(customer_id);
