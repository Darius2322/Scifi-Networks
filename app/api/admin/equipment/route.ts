import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const schema = z.object({
  site_id: z.string().uuid(),
  model: z.string().trim().min(1).max(100),
  serial_number: z.string().trim().max(100).optional().or(z.literal('')),
  mac_address: z.string().trim().max(50).optional().or(z.literal('')),
  condition: z.string().trim().max(50).default('good'),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('equipment')
    .select('*, sites(name), customers:assigned_customer_id(full_name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Could not load equipment.' }, { status: 500 });
  return NextResponse.json({ equipment: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the details.' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('equipment').insert({
    site_id: parsed.data.site_id,
    model: parsed.data.model,
    serial_number: parsed.data.serial_number || null,
    mac_address: parsed.data.mac_address || null,
    condition: parsed.data.condition,
    status: 'in_stock',
  });

  if (error) {
    const message = error.code === '23505' ? 'That serial number or MAC address is already in use.' : 'Could not create equipment record.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logAudit({ actorId: auth.userId, action: 'equipment.created', entityType: 'equipment' });

  return NextResponse.json({ ok: true }, { status: 201 });
}
