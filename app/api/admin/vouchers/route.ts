import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const issueVoucherSchema = z.object({
  agent_id: z.string().uuid(),
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

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('vouchers')
    .select('id, code, status, value_kes, issued_at, expires_at, reserved_by, reservation_expires_at, agents(customers(full_name))')
    .order('issued_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Could not load vouchers.' }, { status: 500 });
  return NextResponse.json({ vouchers: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = issueVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: agent } = await supabase.from('agents').select('id, site_id, status').eq('id', parsed.data.agent_id).single();
  if (!agent || agent.status !== 'active') {
    return NextResponse.json({ error: 'This agent is not eligible for a voucher right now.' }, { status: 400 });
  }

  const { data: voucher, error } = await supabase
    .from('vouchers')
    .insert({
      code: generateVoucherCode(),
      agent_id: agent.id,
      site_id: agent.site_id,
      package_id: parsed.data.package_id || null,
      value_kes: parsed.data.value_kes ?? null,
      expires_at: parsed.data.expires_at || null,
      issued_by: auth.userId,
      status: 'available',
    })
    .select('id, code')
    .single();

  if (error || !voucher) return NextResponse.json({ error: 'Could not issue voucher.' }, { status: 500 });

  await supabase.from('notifications').insert({
    customer_id: (await supabase.from('agents').select('customer_id').eq('id', agent.id).single()).data?.customer_id,
    title: 'Voucher issued',
    body: `A new voucher (${voucher.code}) has been issued to your account.`,
    category: 'voucher',
  });

  await logAudit({
    actorId: auth.userId,
    action: 'voucher.issued',
    entityType: 'voucher',
    entityId: voucher.id,
    siteId: agent.site_id,
    metadata: { code: voucher.code, agent_id: agent.id },
  });

  return NextResponse.json({ id: voucher.id, code: voucher.code }, { status: 201 });
}
