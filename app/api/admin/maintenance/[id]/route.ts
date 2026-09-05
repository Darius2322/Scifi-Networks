import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  is_published: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the details.' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('maintenance_notices').update(parsed.data).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not update notice.' }, { status: 500 });

  await logAudit({ actorId: auth.userId, action: 'maintenance.updated', entityType: 'maintenance_notice', entityId: params.id, metadata: parsed.data });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  await supabase.from('maintenance_notices').delete().eq('id', params.id);
  return NextResponse.json({ ok: true });
}
