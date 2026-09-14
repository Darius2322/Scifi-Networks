import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const createItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(2).max(60),
  category: z.string().trim().min(2).max(80),
  unit: z.string().trim().min(1).max(20).default('pcs'),
  minimum_stock: z.coerce.number().min(0).default(0),
  current_stock: z.coerce.number().min(0).default(0),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the item details and try again.' }, { status: 400 });
  }

  // site_id is deliberately NOT accepted from the client — it's resolved
  // from the caller's own profile, so a staff member can never create a
  // record for a site they don't belong to (RLS would reject it anyway,
  // but this avoids relying on that alone for a clear error message).
  const { data: profile } = await supabase.from('app_users').select('site_id').eq('id', user.id).single();
  if (!profile?.site_id) {
    return NextResponse.json({ error: 'Your account is not assigned to a site.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ ...parsed.data, description: parsed.data.description || null, site_id: profile.site_id })
    .select('id')
    .single();

  if (error) {
    const message = error.code === '23505' ? 'An item with that SKU already exists.' : 'Could not create item.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
