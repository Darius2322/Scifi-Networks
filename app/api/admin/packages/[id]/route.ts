import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updatePackageSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  speed_mbps: z.coerce.number().int().positive().optional(),
  price_kes: z.coerce.number().positive().optional(),
  duration_days: z.coerce.number().int().positive().optional(),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  features: z.array(z.string().trim().max(120)).max(20).optional(),
  is_active: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  site_ids: z.array(z.string().uuid()).optional(),
  service_type: z.enum(['home', 'business', 'hotspot']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updatePackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { site_ids, ...fields } = parsed.data;

  const { error } = await supabase
    .from('packages')
    .update({
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.speed_mbps !== undefined && { speed_mbps: fields.speed_mbps }),
      ...(fields.price_kes !== undefined && { price_kes: fields.price_kes }),
      ...(fields.duration_days !== undefined && { duration_days: fields.duration_days }),
      ...(fields.description !== undefined && { description: fields.description || null }),
      ...(fields.features !== undefined && { features: fields.features }),
      ...(fields.is_active !== undefined && { is_active: fields.is_active }),
      ...(fields.is_archived !== undefined && { is_archived: fields.is_archived }),
      ...(fields.service_type !== undefined && { service_type: fields.service_type }),
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Could not update package.' }, { status: 500 });

  if (site_ids) {
    await supabase.from('package_sites').delete().eq('package_id', params.id);
    if (site_ids.length > 0) {
      await supabase.from('package_sites').insert(site_ids.map((site_id) => ({ package_id: params.id, site_id })));
    }
  }

  await logAudit({
    actorId: auth.userId,
    action: 'package.updated',
    entityType: 'package',
    entityId: params.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
