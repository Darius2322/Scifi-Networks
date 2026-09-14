import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const movementSchema = z.object({
  item_id: z.string().uuid(),
  action: z.enum(['add', 'remove', 'issue', 'return', 'transfer', 'adjust', 'mark_damaged', 'mark_lost']),
  quantity: z.coerce.number().positive(),
  reason: z.string().trim().max(300).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  related_installation_id: z.string().uuid().optional().or(z.literal('')),
  related_ticket_id: z.string().uuid().optional().or(z.literal('')),
});

/**
 * No role/site filtering happens in this file at all — RLS on
 * inventory_items (db/002_rls.sql) already restricts every query here to
 * the caller's own site, and inventory_items_write/_update policies
 * restrict writes to site_manager/inventory_staff/admin/owner. Using the
 * session-bound client rather than the service role is what makes that
 * enforcement real instead of decorative.
 */
export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, sku, category, unit, current_stock, minimum_stock, condition, site_id')
    .order('name');

  if (error) return NextResponse.json({ error: 'Could not load inventory.' }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = movementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the movement details and try again.' }, { status: 400 });
  }

  const { data: txn, error } = await supabase.rpc('record_inventory_transaction', {
    p_item_id: parsed.data.item_id,
    p_action: parsed.data.action,
    p_quantity: parsed.data.quantity,
    p_reason: parsed.data.reason || null,
    p_notes: parsed.data.notes || null,
    p_related_installation_id: parsed.data.related_installation_id || null,
    p_related_ticket_id: parsed.data.related_ticket_id || null,
  });

  if (error) {
    // The function's own exceptions (negative stock, not found, etc.) are
    // safe to surface directly — they're already written as user-facing text.
    return NextResponse.json({ error: error.message || "We couldn't complete that request." }, { status: 400 });
  }

  return NextResponse.json({ transaction: txn }, { status: 201 });
}
