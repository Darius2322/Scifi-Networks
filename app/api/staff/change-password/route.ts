import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid password.' }, { status: 400 });
  }

  const { error: updateAuthErr } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (updateAuthErr) {
    return NextResponse.json({ error: "We couldn't update your password. Please try again." }, { status: 500 });
  }

  const admin = createServiceRoleClient();
  await admin.from('app_users').update({ must_change_password: false }).eq('id', user.id);
  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'password.changed',
    entity_type: 'app_users',
    entity_id: user.id,
    metadata: { self_service: true },
  });

  return NextResponse.json({ ok: true });
}
