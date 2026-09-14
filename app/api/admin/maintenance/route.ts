import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  site_id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  affected_service: z.string().trim().max(100).optional().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  starts_at: z.string(),
  ends_at: z.string().optional().or(z.literal('')),
  is_published: z.boolean().default(false),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('maintenance_notices')
    .select('*, sites(name)')
    .order('starts_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Could not load maintenance notices.' }, { status: 500 });
  return NextResponse.json({ notices: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('maintenance_notices').insert({
    site_id: parsed.data.site_id || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    affected_service: parsed.data.affected_service || null,
    priority: parsed.data.priority,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at || null,
    is_published: parsed.data.is_published,
    created_by: auth.userId,
  });

  if (error) return NextResponse.json({ error: 'Could not create maintenance notice.' }, { status: 500 });

  await logAudit({ actorId: auth.userId, action: 'maintenance.created', entityType: 'maintenance_notice', metadata: { title: parsed.data.title } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
