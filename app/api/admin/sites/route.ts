import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const createSiteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, slug, description, is_active, network_status, manager_id, created_at')
    .order('name');

  if (error) return NextResponse.json({ error: 'Could not load sites.' }, { status: 500 });
  return NextResponse.json({ sites: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the site details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('sites')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
    })
    .select('id')
    .single();

  if (error) {
    const message = error.code === '23505' ? 'A site with that name or slug already exists.' : 'Could not create site.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logAudit({ actorId: auth.userId, action: 'site.created', entityType: 'site', entityId: data.id, siteId: data.id });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
