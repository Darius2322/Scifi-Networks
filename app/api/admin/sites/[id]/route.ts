import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updateSiteSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  network_status: z.enum(['operational', 'partial_outage', 'major_outage', 'maintenance']).optional(),
  manager_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // If assigning a manager, verify that user exists, is active, and holds a
  // staff-eligible role — never trust the client to only send valid IDs.
  if (parsed.data.manager_id) {
    const { data: candidate } = await supabase
      .from('app_users')
      .select('id, role, is_active')
      .eq('id', parsed.data.manager_id)
      .single();

    if (!candidate || !candidate.is_active || !['site_manager', 'supervisor', 'owner', 'admin'].includes(candidate.role)) {
      return NextResponse.json({ error: 'That user cannot be assigned as a site manager.' }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from('sites')
    .update({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.is_active !== undefined && { is_active: parsed.data.is_active }),
      ...(parsed.data.network_status !== undefined && { network_status: parsed.data.network_status }),
      ...(parsed.data.manager_id !== undefined && { manager_id: parsed.data.manager_id }),
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Could not update site.' }, { status: 500 });

  await logAudit({
    actorId: auth.userId,
    action: 'site.updated',
    entityType: 'site',
    entityId: params.id,
    siteId: params.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
