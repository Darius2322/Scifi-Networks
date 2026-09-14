import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  agent_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(200),
  value_kes: z.coerce.number().positive().optional(),
  package_id: z.string().uuid().optional().or(z.literal('')),
  expires_at: z.string().optional().or(z.literal('')),
});

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SCIFI-V-${code}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the batch details.' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: agent } = await supabase.from('agents').select('id, site_id, status').eq('id', parsed.data.agent_id).single();
  if (!agent || agent.status !== 'active') {
    return NextResponse.json({ error: 'This agent is not eligible for vouchers right now.' }, { status: 400 });
  }

  const rows = Array.from({ length: parsed.data.quantity }, () => ({
    code: generateVoucherCode(),
    agent_id: agent.id,
    site_id: agent.site_id,
    package_id: parsed.data.package_id || null,
    value_kes: parsed.data.value_kes ?? null,
    expires_at: parsed.data.expires_at || null,
    issued_by: auth.userId,
    status: 'available' as const,
  }));

  const { data: created, error } = await supabase.from('vouchers').insert(rows).select('id');
  if (error) return NextResponse.json({ error: 'Could not create the voucher batch.' }, { status: 500 });

  await logAudit({
    actorId: auth.userId,
    action: 'voucher.batch_issued',
    entityType: 'voucher',
    siteId: agent.site_id,
    metadata: { agent_id: agent.id, quantity: parsed.data.quantity },
  });

  return NextResponse.json({ created: created?.length ?? 0 }, { status: 201 });
}
