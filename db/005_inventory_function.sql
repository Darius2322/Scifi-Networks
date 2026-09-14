-- ============================================================================
-- SciFi Networks — Inventory transaction function
--
-- Runs as SECURITY INVOKER (the default) — RLS on inventory_items and
-- inventory_transactions still applies exactly as if the caller ran these
-- statements directly. This function exists purely for atomicity (row lock
-- + balance update + audit-trail insert in one transaction), not to grant
-- any permission the caller didn't already have.
-- ============================================================================

create or replace function record_inventory_transaction(
  p_item_id uuid,
  p_action inventory_action,
  p_quantity numeric,
  p_reason text default null,
  p_notes text default null,
  p_related_installation_id uuid default null,
  p_related_ticket_id uuid default null
) returns inventory_transactions
language plpgsql
as $$
declare
  v_item inventory_items%rowtype;
  v_new_balance numeric;
  v_txn inventory_transactions%rowtype;
begin
  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into v_item from inventory_items where id = p_item_id for update;
  if not found then
    raise exception 'Inventory item not found or not accessible';
  end if;

  if p_action in ('add', 'return') then
    v_new_balance := v_item.current_stock + p_quantity;
  elsif p_action in ('remove', 'issue', 'transfer', 'mark_damaged', 'mark_lost') then
    v_new_balance := v_item.current_stock - p_quantity;
  elsif p_action = 'adjust' then
    v_new_balance := p_quantity; -- adjust sets the absolute stock level
  else
    raise exception 'Unsupported inventory action: %', p_action;
  end if;

  if v_new_balance < 0 then
    raise exception 'This would take stock below zero (currently %)', v_item.current_stock;
  end if;

  update inventory_items set current_stock = v_new_balance where id = p_item_id;

  insert into inventory_transactions (
    item_id, action, quantity, balance_after, performed_by,
    related_installation_id, related_ticket_id, site_id, reason, notes
  )
  values (
    p_item_id, p_action, p_quantity, v_new_balance, auth.uid(),
    p_related_installation_id, p_related_ticket_id, v_item.site_id, p_reason, p_notes
  )
  returning * into v_txn;

  return v_txn;
end;
$$;
