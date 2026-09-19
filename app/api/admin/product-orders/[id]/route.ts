import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updateOrderSchema = z.object({
  status: z.enum(['fulfilled', 'cancelled']),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('product_orders')
    .update({ status: parsed.data.status })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Could not update order.' }, { status: 500 });

  await logAudit({
    actorId: auth.userId,
    action: 'product_order.status_changed',
    entityType: 'product_order',
    entityId: params.id,
    metadata: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
