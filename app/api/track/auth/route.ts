import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { trackAuthSchema } from '@/lib/validation';
import { isTrackLookupRateLimited } from '@/lib/auth/rate-limit';
import { SignJWT } from 'jose';

const TRACK_SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours

/**
 * A ticket number ALONE never returns customer data (spec section 56).
 * This endpoint requires ticket_number + a matching phone/email before
 * issuing a short-lived, narrowly-scoped signed token limited to that one
 * installation record. The token is set as an httpOnly cookie — never
 * returned in a readable form to client JS.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  const body = await req.json().catch(() => null);
  const parsed = trackAuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter your ticket number and phone or email.' }, { status: 400 });
  }

  const { ticket_number, contact } = parsed.data;
  const limiterKey = `${ip}:${ticket_number.toLowerCase()}`;
  if (isTrackLookupRateLimited(limiterKey)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: installation, error } = await supabase
    .from('installations')
    .select('id, ticket_number, customer_id, customers(id, full_name, phone, email)')
    .eq('ticket_number', ticket_number.trim().toUpperCase())
    .maybeSingle();

  // Deliberately generic error — do not reveal whether the ticket number
  // exists at all if the contact doesn't match, to avoid enumeration.
  const genericError = NextResponse.json(
    { error: 'We could not verify those details. Check your ticket number and phone/email and try again.' },
    { status: 401 }
  );

  if (error || !installation || !installation.customers) {
    return genericError;
  }

  const customer = Array.isArray(installation.customers) ? installation.customers[0] : installation.customers;
  const contactNormalized = contact.trim().toLowerCase();
  const matches =
    (customer.phone && customer.phone.replace(/\s+/g, '') === contact.trim().replace(/\s+/g, '')) ||
    (customer.email && customer.email.toLowerCase() === contactNormalized);

  if (!matches) {
    return genericError;
  }

  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
  const token = await new SignJWT({
    scope: 'track_portal',
    installation_id: installation.id,
    customer_id: customer.id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TRACK_SESSION_TTL_SECONDS}s`)
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('scifi_track_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TRACK_SESSION_TTL_SECONDS,
  });

  await supabase.from('audit_logs').insert({
    action: 'track.session_created',
    entity_type: 'installation',
    entity_id: installation.id,
    metadata: { ip },
  });

  return res;
}
