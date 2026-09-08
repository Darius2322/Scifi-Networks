import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  assigned_to: z.string().uuid(),
  site_id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('staff_tasks')
    .select('*, app_users!staff_tasks_assigned_to_fkey(full_name), sites(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Could not load tasks.' }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the details.' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('staff_tasks').insert({
    assigned_to: parsed.data.assigned_to,
    site_id: parsed.data.site_id || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    created_by: auth.userId,
  });

  if (error) return NextResponse.json({ error: 'Could not create task.' }, { status: 500 });

  await logAudit({ actorId: auth.userId, action: 'task.assigned', entityType: 'staff_task', metadata: { assigned_to: parsed.data.assigned_to, title: parsed.data.title } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
