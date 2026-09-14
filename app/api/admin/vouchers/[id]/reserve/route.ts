import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('reserve_voucher', {
    p_voucher_id: params.id,
    p_reserved_by: auth.userId,
    p_hold_minutes: 30,
  });

  if (error) {
    return NextResponse.json({ error: error.message || 'Could not reserve this voucher.' }, { status: 400 });
  }

  await logAudit({ actorId: auth.userId, action: 'voucher.reserved', entityType: 'voucher', entityId: params.id });

  return NextResponse.json({ voucher: data });
}
