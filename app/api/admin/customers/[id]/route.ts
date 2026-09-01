import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updateCustomerSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  estate_area: z.string().trim().max(120).optional(),
  is_suspended: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();

  const [{ data: customer }, { data: installations }, { data: tickets }, { data: payments }] = await Promise.all([
    supabase.from('customers').select('*, sites(name)').eq('id', params.id).single(),
    supabase.from('installations').select('id, ticket_number, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('tickets').select('id, ticket_number, type, subject, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('payments').select('id, amount_kes, method, status, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
  ]);

  if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });

  return NextResponse.json({
    customer,
    installations: installations ?? [],
    tickets: tickets ?? [],
    payments: payments ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('customers')
    .update({
      ...(parsed.data.full_name !== undefined && { full_name: parsed.data.full_name }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
      ...(parsed.data.estate_area !== undefined && { estate_area: parsed.data.estate_area }),
      ...(parsed.data.is_suspended !== undefined && { is_suspended: parsed.data.is_suspended }),
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Could not update customer.' }, { status: 500 });

  await logAudit({
    actorId: auth.userId,
    action: parsed.data.is_suspended !== undefined ? (parsed.data.is_suspended ? 'customer.suspended' : 'customer.reactivated') : 'customer.updated',
    entityType: 'customer',
    entityId: params.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
