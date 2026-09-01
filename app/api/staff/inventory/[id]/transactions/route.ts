import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('id, action, quantity, balance_after, reason, notes, created_at, performed_by')
    .eq('item_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: 'Could not load transaction history.' }, { status: 500 });

  // Resolve names for display without exposing a full user lookup endpoint.
  const performerIds = [...new Set((data ?? []).map((t) => t.performed_by).filter(Boolean))] as string[];
  let names: Record<string, string> = {};
  if (performerIds.length > 0) {
    const { data: users } = await supabase.from('app_users').select('id, full_name').in('id', performerIds);
    names = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name]));
  }

  return NextResponse.json({
    transactions: (data ?? []).map((t) => ({ ...t, performed_by_name: names[t.performed_by] ?? 'Unknown' })),
  });
}
