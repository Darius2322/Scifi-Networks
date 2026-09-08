import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  customer_id: z.string().uuid(),
  amount_kes: z.coerce.number().positive(),
  method: z.string().trim().min(1).max(30).default('mpesa'),
  reference: z.string().trim().max(100).optional().or(z.literal('')),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('payments')
    .select('id, amount_kes, method, status, reference, created_at, customers(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: 'Could not load payments.' }, { status: 500 });
  return NextResponse.json({ payments: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the payment details.' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: customer } = await supabase.from('customers').select('site_id').eq('id', parsed.data.customer_id).single();

  const { error } = await supabase.from('payments').insert({
    customer_id: parsed.data.customer_id,
    site_id: customer?.site_id ?? null,
    amount_kes: parsed.data.amount_kes,
    method: parsed.data.method,
    reference: parsed.data.reference || null,
    status: 'completed',
    recorded_by: auth.userId,
  });

  if (error) {
    const message = error.code === '23505' ? 'A payment with that reference already exists.' : 'Could not record payment.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logAudit({ actorId: auth.userId, action: 'payment.recorded', entityType: 'payment', metadata: { amount_kes: parsed.data.amount_kes } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
