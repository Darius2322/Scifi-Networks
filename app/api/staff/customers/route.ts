import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const q = req.nextUrl.searchParams.get('q')?.trim();

  let query = supabase
    .from('customers')
    .select('id, full_name, phone, email, estate_area, is_suspended')
    .order('created_at', { ascending: false })
    .limit(50);

  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load customers.' }, { status: 500 });

  return NextResponse.json({ customers: data });
}
