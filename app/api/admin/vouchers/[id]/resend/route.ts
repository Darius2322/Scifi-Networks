import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data: voucher } = await supabase
    .from('vouchers')
    .select('id, code, agent_id, agents(customer_id)')
    .eq('id', params.id)
    .single();

  if (!voucher) return NextResponse.json({ error: 'Voucher not found.' }, { status: 404 });

  const agentRel = Array.isArray(voucher.agents) ? voucher.agents[0] : voucher.agents;
  if (agentRel?.customer_id) {
    await supabase.from('notifications').insert({
      customer_id: agentRel.customer_id,
      title: 'Voucher reminder',
      body: `Here's your voucher code again: ${voucher.code}`,
      category: 'voucher',
    });
  }

  await logAudit({ actorId: auth.userId, action: 'voucher.resent', entityType: 'voucher', entityId: params.id });

  return NextResponse.json({ ok: true });
}
