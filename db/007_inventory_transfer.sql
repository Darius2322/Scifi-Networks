-- ============================================================================
-- SciFi Networks — 007: main warehouse + inter-site inventory transfer
-- ============================================================================

alter table sites add column if not exists is_main_warehouse boolean not null default false;

-- ----------------------------------------------------------------------------
-- Moves stock from one site's inventory item to the matching item (by SKU)
-- at another site, creating the destination item if it doesn't exist yet.
-- Wraps both sides of the move in one function so a failure partway through
-- can't leave stock deducted from the source without landing at the
-- destination. SECURITY DEFINER since this legitimately needs to touch two
-- different sites' inventory in one operation — normal RLS scopes a caller
-- to their own site only, which would make a cross-site transfer impossible
-- to express as two separate calls under a technician's own permissions.
-- Restricted to admin/owner by the calling API route, not by this function
-- alone (see /api/admin/inventory/transfer).
-- ----------------------------------------------------------------------------
create or replace function transfer_inventory_stock(
  p_source_item_id uuid,
  p_destination_site_id uuid,
  p_quantity numeric,
  p_performed_by uuid,
  p_notes text default null
) returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_source inventory_items%rowtype;
  v_dest inventory_items%rowtype;
  v_new_source_balance numeric;
  v_new_dest_balance numeric;
begin
  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into v_source from inventory_items where id = p_source_item_id for update;
  if not found then
    raise exception 'Source item not found';
  end if;

  if v_source.current_stock < p_quantity then
    raise exception 'Not enough stock at source (currently %)', v_source.current_stock;
  end if;

  -- Find or create the matching item at the destination site (matched by SKU).
  select * into v_dest from inventory_items where sku = v_source.sku and site_id = p_destination_site_id for update;

  if not found then
    insert into inventory_items (site_id, name, sku, category, unit, current_stock, minimum_stock, condition, description)
    values (p_destination_site_id, v_source.name, v_source.sku, v_source.category, v_source.unit, 0, v_source.minimum_stock, v_source.condition, v_source.description)
    returning * into v_dest;
  end if;

  v_new_source_balance := v_source.current_stock - p_quantity;
  v_new_dest_balance := v_dest.current_stock + p_quantity;

  update inventory_items set current_stock = v_new_source_balance where id = v_source.id;
  update inventory_items set current_stock = v_new_dest_balance where id = v_dest.id;

  insert into inventory_transactions (item_id, action, quantity, balance_after, performed_by, site_id, reason, notes)
  values (v_source.id, 'transfer', p_quantity, v_new_source_balance, p_performed_by, v_source.site_id, 'Transferred to another site', p_notes);

  insert into inventory_transactions (item_id, action, quantity, balance_after, performed_by, site_id, reason, notes)
  values (v_dest.id, 'add', p_quantity, v_new_dest_balance, p_performed_by, v_dest.site_id, 'Received via transfer', p_notes);

  return jsonb_build_object('source_item_id', v_source.id, 'destination_item_id', v_dest.id, 'quantity', p_quantity);
end;
$$;
