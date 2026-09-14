import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updateTicketSchema = z.object({
  status: z.enum([
    'submitted', 'pending_review', 'approved', 'rejected', 'assigned',
    'scheduled', 'in_progress', 'waiting_customer', 'resolved', 'completed', 'cancelled',
  ]).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();

  const [{ data: ticket }, { data: updates }, { data: eligibleStaff }] = await Promise.all([
    supabase
      .from('tickets')
      .select('*, sites(id, name), customers(full_name, phone, email), agents(customers(full_name))')
      .eq('id', params.id)
      .single(),
    supabase
      .from('ticket_updates')
      .select('id, message, is_internal, author_id, created_at')
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true }),
    supabase.from('app_users').select('id, full_name, role').not('role', 'in', '(agent,customer)').eq('is_active', true),
  ]);

  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  const authorIds = [...new Set((updates ?? []).map((u: any) => u.author_id).filter(Boolean))] as string[];
  let authorNames: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authors } = await supabase.from('app_users').select('id, full_name').in('id', authorIds);
    authorNames = Object.fromEntries((authors ?? []).map((a: any) => [a.id, a.full_name]));
  }

  return NextResponse.json({
    ticket,
    updates: (updates ?? []).map((u: any) => ({ ...u, author_name: u.author_id ? authorNames[u.author_id] ?? 'Unknown' : 'System' })),
    eligibleStaff: eligibleStaff ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({
      ...parsed.data,
      ...(parsed.data.status && ['resolved', 'completed'].includes(parsed.data.status) && { resolved_at: new Date().toISOString() }),
    })
    .eq('id', params.id)
    .select('site_id, customer_id, ticket_number')
    .single();

  if (error || !ticket) return NextResponse.json({ error: 'Could not update ticket.' }, { status: 500 });

  if (parsed.data.status && ticket.customer_id) {
    await supabase.from('notifications').insert({
      customer_id: ticket.customer_id,
      title: 'Ticket status updated',
      body: `Your ticket ${ticket.ticket_number} is now ${parsed.data.status.replace('_', ' ')}.`,
      category: 'ticket',
      related_ticket_id: params.id,
    });
  }

  await logAudit({
    actorId: auth.userId,
    action: 'ticket.updated',
    entityType: 'ticket',
    entityId: params.id,
    siteId: ticket.site_id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
