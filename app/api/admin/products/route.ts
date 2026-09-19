import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const createProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  price_kes: z.coerce.number().positive(),
  category: z.string().trim().min(2).max(60).default('general'),
  image_url: z.string().trim().url().max(500).optional().or(z.literal('')),
  stock_qty: z.coerce.number().int().min(0).default(0),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price_kes, category, image_url, stock_qty, is_active, is_archived')
    .order('category')
    .order('name');

  if (error) return NextResponse.json({ error: 'Could not load products.' }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the product details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_kes: parsed.data.price_kes,
      category: parsed.data.category,
      image_url: parsed.data.image_url || null,
      stock_qty: parsed.data.stock_qty,
    })
    .select('id')
    .single();

  if (error || !product) return NextResponse.json({ error: 'Could not create product.' }, { status: 500 });

  await logAudit({ actorId: auth.userId, action: 'product.created', entityType: 'product', entityId: product.id });

  return NextResponse.json({ id: product.id }, { status: 201 });
}
