import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  status: z.enum(['in_stock', 'assigned', 'installed', 'faulty', 'under_repair', 'lost', 'retired']).optional(),
  assigned_customer_id: z.string().uuid().nullable().optional(),
  condition: z.string().trim().max(50).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the details.' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('equipment').update(parsed.data).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not update equipment.' }, { status: 500 });

  await logAudit({ actorId: auth.userId, action: 'equipment.updated', entityType: 'equipment', entityId: params.id, metadata: parsed.data });

  return NextResponse.json({ ok: true });
}
