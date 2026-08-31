import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { installationRequestSchema } from '@/lib/validation';
import { isRateLimited } from '@/lib/auth/rate-limit';

/**
 * Public endpoint — anyone can submit an installation request. Uses the
 * service role because the requester has no session yet, but every field
 * is validated and only a narrow set of columns is ever written.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`installation-submit:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = installationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'We could not complete that request. Please check your details and try again.', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = createServiceRoleClient();

  try {
    // 1. Find or create a lightweight customer record.
    let customerId: string;
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .or(`phone.eq.${data.phone},email.eq.${data.email || '__none__'}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      customerId = existing.id;
    } else {
      const { data: created, error: customerErr } = await supabase
        .from('customers')
        .insert({
          full_name: data.full_name,
          phone: data.phone,
          email: data.email || null,
          site_id: data.site_id,
          estate_area: data.estate_area,
          address_details: data.address_details || null,
        })
        .select('id')
        .single();

      if (customerErr) throw customerErr;
      customerId = created.id;
    }

    // 2. Generate the ticket number via the DB sequence function (atomic, no race conditions).
    const { data: ticketNumberResult, error: seqErr } = await supabase.rpc('next_ticket_number', {
      p_prefix: 'INS',
    });
    if (seqErr) throw seqErr;

    // 3. Create the installation request.
    const { data: installation, error: installErr } = await supabase
      .from('installations')
      .insert({
        ticket_number: ticketNumberResult,
        customer_id: customerId,
        site_id: data.site_id,
        package_id: data.package_id || null,
        preferred_datetime: data.preferred_datetime || null,
        additional_notes: data.additional_notes || null,
        status: 'submitted',
      })
      .select('ticket_number')
      .single();

    if (installErr) throw installErr;

    // 4. Audit log (append-only, service role write).
    await supabase.from('audit_logs').insert({
      action: 'installation.submitted',
      entity_type: 'installation',
      site_id: data.site_id,
      metadata: { ticket_number: installation.ticket_number, source: 'public_website' },
    });

    return NextResponse.json({ ticket_number: installation.ticket_number }, { status: 201 });
  } catch (err) {
    console.error('installation submit failed', err);
    return NextResponse.json(
      { error: "We couldn't complete that request. Please try again." },
      { status: 500 }
    );
  }
}
