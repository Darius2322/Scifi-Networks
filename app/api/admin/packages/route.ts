import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const createPackageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  speed_mbps: z.coerce.number().int().positive(),
  price_kes: z.coerce.number().positive(),
  duration_days: z.coerce.number().int().positive().default(30),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  features: z.array(z.string().trim().max(120)).max(20).default([]),
  site_ids: z.array(z.string().uuid()).default([]),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, speed_mbps, price_kes, duration_days, description, features, is_active, is_archived, package_sites(site_id)')
    .order('price_kes');

  if (error) return NextResponse.json({ error: 'Could not load packages.' }, { status: 500 });
  return NextResponse.json({ packages: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the package details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: pkg, error } = await supabase
    .from('packages')
    .insert({
      name: parsed.data.name,
      speed_mbps: parsed.data.speed_mbps,
      price_kes: parsed.data.price_kes,
      duration_days: parsed.data.duration_days,
      description: parsed.data.description || null,
      features: parsed.data.features,
    })
    .select('id')
    .single();

  if (error || !pkg) return NextResponse.json({ error: 'Could not create package.' }, { status: 500 });

  if (parsed.data.site_ids.length > 0) {
    await supabase
      .from('package_sites')
      .insert(parsed.data.site_ids.map((site_id) => ({ package_id: pkg.id, site_id })));
  }

  await logAudit({ actorId: auth.userId, action: 'package.created', entityType: 'package', entityId: pkg.id });

  return NextResponse.json({ id: pkg.id }, { status: 201 });
}
