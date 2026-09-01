import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const updateTicketSchema = z.object({
  status: z.enum([
    'submitted', 'pending_review', 'approved', 'rejected', 'assigned',
    'scheduled', 'in_progress', 'waiting_customer', 'resolved', 'completed', 'cancelled',
  ]).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();

  // RLS restricts this select to tickets at the caller's own site — a
  // technician at Nyanchwa querying a Kemera ticket ID simply gets no row.
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, sites(id, name), customers(full_name, phone, email)')
    .eq('id', params.id)
    .single();

  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  const { data: updates } = await supabase
    .from('ticket_updates')
    .select('id, message, is_internal, author_id, created_at')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true });

  const { data: eligibleStaff } = await supabase
    .from('app_users')
    .select('id, full_name, role')
    .eq('site_id', ticket.site_id)
    .not('role', 'in', '(agent,customer)')
    .eq('is_active', true);

  const authorIds = [...new Set((updates ?? []).map((u) => u.author_id).filter(Boolean))] as string[];
  let authorNames: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authors } = await supabase.from('app_users').select('id, full_name').in('id', authorIds);
    authorNames = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name]));
  }

  return NextResponse.json({
    ticket,
    updates: (updates ?? []).map((u) => ({ ...u, author_name: u.author_id ? authorNames[u.author_id] ?? 'Unknown' : 'System' })),
    eligibleStaff: eligibleStaff ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({
      ...parsed.data,
      ...(parsed.data.status && ['resolved', 'completed'].includes(parsed.data.status) && { resolved_at: new Date().toISOString() }),
    })
    .eq('id', params.id)
    .select('customer_id, ticket_number')
    .single();

  // RLS silently returns no row if this ticket isn't at the caller's site —
  // surfaced here as a generic failure rather than leaking which IDs exist.
  if (error || !ticket) return NextResponse.json({ error: 'Could not update ticket.' }, { status: 400 });

  if (parsed.data.status && ticket.customer_id) {
    await supabase.from('notifications').insert({
      customer_id: ticket.customer_id,
      title: 'Ticket status updated',
      body: `Your ticket ${ticket.ticket_number} is now ${parsed.data.status.replace('_', ' ')}.`,
      category: 'ticket',
      related_ticket_id: params.id,
    });
  }

  return NextResponse.json({ ok: true });
}
