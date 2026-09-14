import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updateAgentSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  site_id: z.string().uuid().optional(),
  physical_location: z.string().trim().max(200).optional().or(z.literal('')),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: agent, error } = await supabase
    .from('agents')
    .update({
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.site_id !== undefined && { site_id: parsed.data.site_id }),
      ...(parsed.data.physical_location !== undefined && { physical_location: parsed.data.physical_location || null }),
    })
    .eq('id', params.id)
    .select('app_user_id, site_id')
    .single();

  if (error || !agent) return NextResponse.json({ error: 'Could not update agent.' }, { status: 500 });

  // Keep the linked login account's active flag and site in sync.
  if (agent.app_user_id) {
    await supabase
      .from('app_users')
      .update({
        ...(parsed.data.status !== undefined && { is_active: parsed.data.status === 'active' }),
        ...(parsed.data.site_id !== undefined && { site_id: parsed.data.site_id }),
      })
      .eq('id', agent.app_user_id);
  }

  await logAudit({
    actorId: auth.userId,
    action: 'agent.updated',
    entityType: 'agent',
    entityId: params.id,
    siteId: agent.site_id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
