import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const createItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(2).max(60),
  category: z.string().trim().min(2).max(80),
  unit: z.string().trim().min(1).max(20).default('pcs'),
  site_id: z.string().uuid(),
  minimum_stock: z.coerce.number().min(0).default(0),
  current_stock: z.coerce.number().min(0).default(0),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, sku, category, unit, current_stock, minimum_stock, condition, sites(name)')
    .order('name');

  if (error) return NextResponse.json({ error: 'Could not load inventory.' }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the item details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ ...parsed.data, description: parsed.data.description || null })
    .select('id')
    .single();

  if (error) {
    const message = error.code === '23505' ? 'An item with that SKU already exists.' : 'Could not create item.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logAudit({ actorId: auth.userId, action: 'inventory.item_created', entityType: 'inventory_item', entityId: data.id, siteId: parsed.data.site_id });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
