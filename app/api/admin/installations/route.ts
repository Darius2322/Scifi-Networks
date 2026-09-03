import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const status = req.nextUrl.searchParams.get('status');

  let query = supabase
    .from('installations')
    .select('id, ticket_number, status, created_at, scheduled_at, sites(name), customers(full_name, phone), packages(name), assigned_technician_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load installations.' }, { status: 500 });
  return NextResponse.json({ installations: data });
}

const updateSchema = z.object({
  status: z.enum([
    'submitted', 'pending_review', 'approved', 'rejected', 'assigned',
    'scheduled', 'in_progress', 'completed', 'cancelled',
  ]).optional(),
  assigned_technician_id: z.string().uuid().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const { id, ...fields } = body ?? {};
  const parsed = updateSchema.safeParse(fields);
  if (!id || !parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: installation, error } = await supabase
    .from('installations')
    .update({
      ...parsed.data,
      ...(parsed.data.status === 'completed' && { completed_at: new Date().toISOString() }),
    })
    .eq('id', id)
    .select('site_id, customer_id, ticket_number')
    .single();

  if (error || !installation) return NextResponse.json({ error: 'Could not update installation.' }, { status: 500 });

  if (parsed.data.status && installation.customer_id) {
    await supabase.from('notifications').insert({
      customer_id: installation.customer_id,
      title: 'Installation status updated',
      body: `Your installation ${installation.ticket_number} is now ${parsed.data.status.replace('_', ' ')}.`,
      category: 'installation',
      related_installation_id: id,
    });
  }

  await logAudit({
    actorId: auth.userId,
    action: 'installation.updated',
    entityType: 'installation',
    entityId: id,
    siteId: installation.site_id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
