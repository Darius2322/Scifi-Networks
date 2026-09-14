import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({ factorId: z.string() });

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { error } = await supabase.auth.mfa.unenroll({ factorId: parsed.data.factorId });
  if (error) return NextResponse.json({ error: 'Could not disable 2FA.' }, { status: 400 });

  await logAudit({ actorId: user.id, action: 'mfa.disabled', entityType: 'app_users', entityId: user.id });

  return NextResponse.json({ ok: true });
}
