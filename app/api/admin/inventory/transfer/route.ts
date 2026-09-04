import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  source_item_id: z.string().uuid(),
  destination_site_id: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the transfer details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('transfer_inventory_stock', {
    p_source_item_id: parsed.data.source_item_id,
    p_destination_site_id: parsed.data.destination_site_id,
    p_quantity: parsed.data.quantity,
    p_performed_by: auth.userId,
    p_notes: parsed.data.notes || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message || 'Could not complete the transfer.' }, { status: 400 });
  }

  await logAudit({
    actorId: auth.userId,
    action: 'inventory.transferred',
    entityType: 'inventory_item',
    entityId: parsed.data.source_item_id,
    metadata: data,
  });

  return NextResponse.json({ ok: true, ...data });
}
