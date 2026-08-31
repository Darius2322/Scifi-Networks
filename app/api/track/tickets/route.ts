import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getTrackSession } from '@/lib/auth/track-session';
import { customerTicketSchema } from '@/lib/validation';
import { isRateLimited } from '@/lib/auth/rate-limit';

export async function POST(req: NextRequest) {
  const session = await getTrackSession();
  if (!session) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }

  if (isRateLimited(`track-ticket:${session.customer_id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = customerTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  }

  // Enforce that the installation being referenced actually belongs to this
  // session — never trust the installation_id from the client alone.
  if (parsed.data.installation_id !== session.installation_id) {
    return NextResponse.json({ error: 'This request does not belong to your account.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: installation } = await supabase
    .from('installations')
    .select('id, site_id, customer_id')
    .eq('id', session.installation_id)
    .single();

  if (!installation) {
    return NextResponse.json({ error: "We couldn't find that request." }, { status: 404 });
  }

  const prefixMap: Record<string, string> = {
    outage: 'OUT',
    coverage: 'COV',
    complaint: 'SUP',
    equipment: 'EQP',
    general_support: 'SUP',
  };

  const { data: ticketNumber, error: seqErr } = await supabase.rpc('next_ticket_number', {
    p_prefix: prefixMap[parsed.data.type] ?? 'SUP',
  });
  if (seqErr) {
    return NextResponse.json({ error: "We couldn't complete that request. Please try again." }, { status: 500 });
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      ticket_number: ticketNumber,
      type: parsed.data.type,
      customer_id: installation.customer_id,
      site_id: installation.site_id,
      installation_id: installation.id,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      location_text: parsed.data.location_text || null,
      status: 'submitted',
    })
    .select('ticket_number')
    .single();

  if (error) {
    return NextResponse.json({ error: "We couldn't complete that request. Please try again." }, { status: 500 });
  }

  await supabase.from('notifications').insert({
    customer_id: installation.customer_id,
    title: 'Support ticket received',
    body: `We've received your report (${ticket.ticket_number}) and will update you here as it progresses.`,
    category: 'ticket',
  });

  await supabase.from('audit_logs').insert({
    action: 'ticket.created',
    entity_type: 'ticket',
    site_id: installation.site_id,
    metadata: { ticket_number: ticket.ticket_number, source: 'track_portal', type: parsed.data.type },
  });

  return NextResponse.json({ ticket_number: ticket.ticket_number }, { status: 201 });
}
