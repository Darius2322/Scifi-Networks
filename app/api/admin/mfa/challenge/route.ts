import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { isLoginRateLimited } from '@/lib/auth/rate-limit';

const schema = z.object({ factorId: z.string(), code: z.string().length(6) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isLoginRateLimited(`mfa:${ip}`)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait and try again.' }, { status: 429 });
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Enter the 6-digit code from your authenticator app.' }, { status: 400 });

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: parsed.data.factorId });
  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Could not verify that code. Please try again.' }, { status: 400 });
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });

  if (verifyError) {
    return NextResponse.json({ error: 'That code was incorrect.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
