import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = req.nextUrl.searchParams.get('q')?.trim();
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('customers')
    .select('id, full_name, phone, email, estate_area, is_agent, is_suspended, created_at, sites(name)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load customers.' }, { status: 500 });

  return NextResponse.json({ customers: data });
}
