import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, logAudit } from '@/lib/auth/admin-guard';

const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  price_kes: z.coerce.number().positive().optional(),
  category: z.string().trim().min(2).max(60).optional(),
  image_url: z.string().trim().url().max(500).optional().or(z.literal('')),
  stock_qty: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  is_archived: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the details and try again.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const fields = parsed.data;

  const { error } = await supabase
    .from('products')
    .update({
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.description !== undefined && { description: fields.description || null }),
      ...(fields.price_kes !== undefined && { price_kes: fields.price_kes }),
      ...(fields.category !== undefined && { category: fields.category }),
      ...(fields.image_url !== undefined && { image_url: fields.image_url || null }),
      ...(fields.stock_qty !== undefined && { stock_qty: fields.stock_qty }),
      ...(fields.is_active !== undefined && { is_active: fields.is_active }),
      ...(fields.is_archived !== undefined && { is_archived: fields.is_archived }),
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Could not update product.' }, { status: 500 });

  await logAudit({
    actorId: auth.userId,
    action: 'product.updated',
    entityType: 'product',
    entityId: params.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
