import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({ factorId: z.string(), code: z.string().length(6) });

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Enter the 6-digit code from your authenticator app.' }, { status: 400 });

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: parsed.data.factorId });
  if (challengeError || !challenge) {
    return NextResponse.json({ error: challengeError?.message || 'Could not verify that code.' }, { status: 400 });
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });

  if (verifyError) {
    return NextResponse.json({ error: 'That code was incorrect. Please try again.' }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  await logAudit({ actorId: user.id, action: 'mfa.enabled', entityType: 'app_users', entityId: user.id });

  return NextResponse.json({ ok: true });
}
