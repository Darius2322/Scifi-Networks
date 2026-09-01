import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';
import { isRateLimited } from '@/lib/auth/rate-limit';

const schema = z.object({
  type: z.enum(['outage', 'coverage', 'equipment', 'general_support']),
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  location_text: z.string().trim().max(200).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }

  if (isRateLimited(`agent-ticket:${user.id}`, 15, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // Look up the agent record tied to this authenticated user — never trust
  // an agent_id supplied by the client.
  const { data: agent } = await admin
    .from('agents')
    .select('id, site_id, customer_id')
    .eq('app_user_id', user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'We could not find your agent profile.' }, { status: 403 });
  }

  const prefixMap: Record<string, string> = {
    outage: 'OUT',
    coverage: 'COV',
    equipment: 'EQP',
    general_support: 'SUP',
  };

  const { data: ticketNumber, error: seqErr } = await admin.rpc('next_ticket_number', {
    p_prefix: prefixMap[parsed.data.type] ?? 'SUP',
  });
  if (seqErr) {
    return NextResponse.json({ error: "We couldn't submit that. Please try again." }, { status: 500 });
  }

  const { data: ticket, error } = await admin
    .from('tickets')
    .insert({
      ticket_number: ticketNumber,
      type: parsed.data.type,
      agent_id: agent.id,
      customer_id: agent.customer_id,
      site_id: agent.site_id,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      location_text: parsed.data.location_text || null,
      status: 'submitted',
    })
    .select('ticket_number')
    .single();

  if (error) {
    return NextResponse.json({ error: "We couldn't submit that. Please try again." }, { status: 500 });
  }

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'ticket.created',
    entity_type: 'ticket',
    site_id: agent.site_id,
    metadata: { ticket_number: ticket.ticket_number, source: 'agent_dashboard', type: parsed.data.type },
  });

  return NextResponse.json({ ticket_number: ticket.ticket_number }, { status: 201 });
}
