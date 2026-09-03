import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  auto_issue_vouchers: z.boolean(),
  voucher_duration_days: z.coerce.number().int().positive().max(365),
  voucher_value_kes: z.coerce.number().positive().optional().nullable(),
  voucher_package_id: z.string().uuid().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('agents').update(parsed.data).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not update auto-issuance settings.' }, { status: 500 });

  // If turning it on, issue one immediately so the agent doesn't wait for
  // the next scheduled check.
  if (parsed.data.auto_issue_vouchers) {
    await supabase.rpc('ensure_agent_voucher', { p_agent_id: params.id });
  }

  await logAudit({ actorId: auth.userId, action: 'agent.voucher_settings_updated', entityType: 'agent', entityId: params.id, metadata: parsed.data });

  return NextResponse.json({ ok: true });
}
