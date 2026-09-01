import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceRoleClient();
  const status = req.nextUrl.searchParams.get('status');
  const siteId = req.nextUrl.searchParams.get('site_id');
  const priority = req.nextUrl.searchParams.get('priority');

  let query = supabase
    .from('tickets')
    .select('id, ticket_number, type, subject, priority, status, created_at, sites(name), assigned_to')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);
  if (siteId) query = query.eq('site_id', siteId);
  if (priority) query = query.eq('priority', priority);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load tickets.' }, { status: 500 });

  return NextResponse.json({ tickets: data });
}
