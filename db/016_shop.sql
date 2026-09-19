-- ----------------------------------------------------------------------------
-- SHOP — internet-related products (routers, cables, extenders, etc.) sold
-- through the public site with M-Pesa checkout.
-- ----------------------------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_kes numeric(10,2) not null check (price_kes >= 0),
  category text not null default 'general',
  image_url text,
  stock_qty int not null default 0 check (stock_qty >= 0),
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text not null,
  site_id uuid references sites(id),
  subtotal_kes numeric(10,2) not null check (subtotal_kes >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'failed', 'cancelled', 'fulfilled')),
  payment_method text not null default 'mpesa',
  mpesa_checkout_request_id text,
  mpesa_merchant_request_id text,
  mpesa_receipt_number text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references product_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,       -- snapshot at time of order
  unit_price_kes numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total_kes numeric(10,2) not null
);

create index idx_product_orders_checkout_request on product_orders(mpesa_checkout_request_id);
create index idx_product_order_items_order on product_order_items(order_id);

create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_product_orders_updated_at before update on product_orders
  for each row execute function set_updated_at();

-- Called from the M-Pesa callback route (service-role, bypasses RLS) once
-- payment is confirmed — never at order creation, so an abandoned or failed
-- checkout never holds stock hostage. Clamped at 0, never negative.
create or replace function decrement_product_stock(p_product_id uuid, p_qty int) returns void as $$
begin
  update products set stock_qty = greatest(stock_qty - p_qty, 0) where id = p_product_id;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table products enable row level security;
alter table product_orders enable row level security;
alter table product_order_items enable row level security;

-- PRODUCTS — publicly readable when active; only admin manages. Same shape
-- as the existing packages_public_read / packages_admin_* policies.
create policy products_public_read on products for select using (
  (is_active = true and is_archived = false) or is_owner_or_admin()
);
create policy products_admin_write on products for insert with check (is_owner_or_admin());
create policy products_admin_update on products for update using (is_owner_or_admin());
create policy products_admin_delete on products for delete using (is_owner_or_admin());

-- PRODUCT_ORDERS / PRODUCT_ORDER_ITEMS — no public read policy at all.
-- Customers never query these tables directly: checkout, status-polling,
-- and the M-Pesa callback all go through API routes using the service-role
-- client (which bypasses RLS), same pattern as /api/public-issues. Only
-- admin/staff can read or write these through the normal client.
create policy product_orders_admin_read on product_orders for select using (is_owner_or_admin());
create policy product_orders_admin_write on product_orders for update using (is_owner_or_admin());

create policy product_order_items_admin_read on product_order_items for select using (is_owner_or_admin());
