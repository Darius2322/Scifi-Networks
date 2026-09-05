import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { staffLoginSchema } from '@/lib/validation';
import { isLoginRateLimited } from '@/lib/auth/rate-limit';
import { resolveLoginIdentifier, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth/login-resolver';

const STAFF_ROLES = ['owner', 'admin', 'site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff', 'customer_care'];

const LOCKOUT_MESSAGE = 'Too many failed attempts. This account is temporarily locked. Try again later.';
const GENERIC_MESSAGE = 'Invalid username/email or password.';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  const body = await req.json().catch(() => null);
  const parsed = staffLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 400 });
  }

  const { identifier, password } = parsed.data;

  if (isLoginRateLimited(`${ip}:${identifier.toLowerCase()}`)) {
    return NextResponse.json({ error: LOCKOUT_MESSAGE }, { status: 429 });
  }

  const lookup = await resolveLoginIdentifier(identifier, STAFF_ROLES);
  if (!lookup.ok) {
    // Deliberately identical message for not_found/inactive to avoid
    // leaking which usernames exist or are disabled.
    if (lookup.reason === 'locked') {
      return NextResponse.json({ error: LOCKOUT_MESSAGE }, { status: 423 });
    }
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: lookup.email, password });

  if (error) {
    await recordFailedLogin(lookup.userId);
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 401 });
  }

  await recordSuccessfulLogin(lookup.userId);

  return NextResponse.json({ ok: true, mustChangePassword: lookup.mustChangePassword });
}
