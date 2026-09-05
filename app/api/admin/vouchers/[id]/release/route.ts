import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('release_voucher_reservation', { p_voucher_id: params.id });

  if (error) return NextResponse.json({ error: 'Could not release this reservation.' }, { status: 400 });

  await logAudit({ actorId: auth.userId, action: 'voucher.reservation_released', entityType: 'voucher', entityId: params.id });

  return NextResponse.json({ voucher: data });
}
