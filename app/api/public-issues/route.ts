import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isRateLimited } from '@/lib/auth/rate-limit';

const publicIssueSchema = z.object({
  reporter_name: z.string().trim().min(2).max(120),
  reporter_contact: z.string().trim().max(120).optional().or(z.literal('')),
  site_id: z.string().uuid(),
  type: z.enum(['outage', 'coverage', 'equipment', 'complaint', 'general_support']),
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  location_text: z.string().trim().max(200).optional().or(z.literal('')),
});

const PREFIX_MAP: Record<string, string> = {
  outage: 'OUT',
  coverage: 'COV',
  equipment: 'EQP',
  complaint: 'SUP',
  general_support: 'SUP',
};

/**
 * No authentication, no phone/email required — anyone can report a problem
 * and get a ticket number back. Deliberately more open than /api/track/tickets
 * (which requires a session), so it's rate-limited more tightly by IP.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`public-issue:${ip}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many reports submitted. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = publicIssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: ticketNumber, error: seqErr } = await supabase.rpc('next_ticket_number', {
    p_prefix: PREFIX_MAP[parsed.data.type] ?? 'SUP',
  });
  if (seqErr) {
    return NextResponse.json({ error: "We couldn't submit that. Please try again." }, { status: 500 });
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      ticket_number: ticketNumber,
      type: parsed.data.type,
      site_id: parsed.data.site_id,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      location_text: parsed.data.location_text || null,
      reporter_name: parsed.data.reporter_name,
      reporter_contact: parsed.data.reporter_contact || null,
      status: 'submitted',
    })
    .select('ticket_number')
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: "We couldn't submit that. Please try again." }, { status: 500 });
  }

  await supabase.from('audit_logs').insert({
    action: 'ticket.created',
    entity_type: 'ticket',
    site_id: parsed.data.site_id,
    metadata: { ticket_number: ticket.ticket_number, source: 'public_report_issue', type: parsed.data.type },
  });

  return NextResponse.json({ ticket_number: ticket.ticket_number }, { status: 201 });
}
