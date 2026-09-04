import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const SETTINGS_KEYS = ['company_contact', 'social_links', 'terms_and_conditions', 'privacy_policy'];

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data } = await supabase.from('settings').select('key, value').in('key', SETTINGS_KEYS);

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.key !== 'string' || !SETTINGS_KEYS.includes(body.key)) {
    return NextResponse.json({ error: 'Invalid setting key.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('settings')
    .upsert({ key: body.key, value: body.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });

  await logAudit({ actorId: auth.userId, action: 'settings.updated', entityType: 'settings', metadata: { key: body.key } });

  return NextResponse.json({ ok: true });
}
