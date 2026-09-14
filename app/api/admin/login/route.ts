import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { staffLoginSchema } from '@/lib/validation';
import { isLoginRateLimited } from '@/lib/auth/rate-limit';
import { resolveLoginIdentifier, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth/login-resolver';
import { createServiceRoleClient } from '@/lib/supabase/server';

const GENERIC_MESSAGE = 'Invalid username/email or password.';
const LOCKOUT_MESSAGE = 'Too many failed attempts. This account is temporarily locked. Try again later.';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  const body = await req.json().catch(() => null);
  const parsed = staffLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 400 });
  }

  const { identifier, password } = parsed.data;

  if (isLoginRateLimited(`admin:${ip}:${identifier.toLowerCase()}`)) {
    return NextResponse.json({ error: LOCKOUT_MESSAGE }, { status: 429 });
  }

  // Deliberately restricted to owner/admin only — this endpoint will never
  // authenticate a technician or site manager, even with correct credentials.
  const lookup = await resolveLoginIdentifier(identifier, ['owner', 'admin']);
  if (!lookup.ok) {
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

  const admin = createServiceRoleClient();
  await admin.from('audit_logs').insert({
    actor_id: lookup.userId,
    action: 'admin.login',
    entity_type: 'app_users',
    entity_id: lookup.userId,
    metadata: { ip },
  });

  // Check whether this account has 2FA enrolled — if so, the password
  // alone only grants a partial (AAL1) session; the login isn't complete
  // until the TOTP code is verified too.
  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = mfaData?.totp?.find((f) => f.status === 'verified');

  if (verifiedTotp) {
    return NextResponse.json({
      ok: true,
      mfaRequired: true,
      factorId: verifiedTotp.id,
      mustChangePassword: lookup.mustChangePassword,
    });
  }

  return NextResponse.json({ ok: true, mustChangePassword: lookup.mustChangePassword });
}
