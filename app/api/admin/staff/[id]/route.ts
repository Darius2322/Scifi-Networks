import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updateStaffSchema = z.object({
  role: z.enum(['site_manager', 'supervisor', 'technician', 'support_staff', 'inventory_staff', 'customer_care']).optional(),
  site_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Never allow this endpoint to touch owner/admin accounts — role
  // escalation/de-escalation of admins happens through a separate, more
  // deliberate process, not the general staff editor.
  const { data: target } = await supabase.from('app_users').select('role').eq('id', params.id).single();
  if (!target || ['owner', 'admin'].includes(target.role)) {
    return NextResponse.json({ error: 'This account cannot be edited here.' }, { status: 403 });
  }

  const { error } = await supabase
    .from('app_users')
    .update({
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      ...(parsed.data.site_id !== undefined && { site_id: parsed.data.site_id }),
      ...(parsed.data.is_active !== undefined && { is_active: parsed.data.is_active }),
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Could not update staff account.' }, { status: 500 });

  await logAudit({
    actorId: auth.userId,
    action: 'staff.updated',
    entityType: 'app_users',
    entityId: params.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
