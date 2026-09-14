import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { agentLoginSchema } from '@/lib/validation';
import { isLoginRateLimited } from '@/lib/auth/rate-limit';
import { resolveLoginIdentifier, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth/login-resolver';

const GENERIC_MESSAGE = 'Invalid username or password.';
const LOCKOUT_MESSAGE = 'Too many failed attempts. This account is temporarily locked. Try again later.';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  const body = await req.json().catch(() => null);
  const parsed = agentLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 400 });
  }

  const { username, password } = parsed.data;

  if (isLoginRateLimited(`${ip}:${username.toLowerCase()}`)) {
    return NextResponse.json({ error: LOCKOUT_MESSAGE }, { status: 429 });
  }

  const lookup = await resolveLoginIdentifier(username, ['agent']);
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

  // Per spec: initial password = phone number, and it MUST be changed after
  // first login. The frontend redirects to a forced change-password screen
  // when this flag is true, before showing anything else.
  return NextResponse.json({ ok: true, mustChangePassword: lookup.mustChangePassword });
}
