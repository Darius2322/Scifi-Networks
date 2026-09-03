import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();

  // If this customer is also an agent, remove the linked login first so we
  // don't leave an orphaned Supabase Auth account behind.
  const { data: agent } = await supabase.from('agents').select('id, app_user_id').eq('customer_id', params.id).maybeSingle();
  if (agent?.app_user_id) {
    await supabase.auth.admin.deleteUser(agent.app_user_id);
  }

  const { error } = await supabase.from('customers').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not delete customer.' }, { status: 500 });

  await logAudit({ actorId: auth.userId, action: 'customer.deleted', entityType: 'customer', entityId: params.id });

  return NextResponse.json({ ok: true });
}
