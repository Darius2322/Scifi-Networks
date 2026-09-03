import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  // Cancel rather than hard-delete when possible, preserving history; only
  // truly removes the row if it was never used.
  const { data: voucher } = await supabase.from('vouchers').select('status').eq('id', params.id).single();

  if (voucher?.status === 'available') {
    await supabase.from('vouchers').update({ status: 'cancelled' }).eq('id', params.id);
  } else {
    await supabase.from('vouchers').delete().eq('id', params.id);
  }

  await logAudit({ actorId: auth.userId, action: 'voucher.cancelled', entityType: 'voucher', entityId: params.id });

  return NextResponse.json({ ok: true });
}
