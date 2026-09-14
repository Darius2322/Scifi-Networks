import { createServerSupabase } from '@/lib/supabase/server';

/**
 * All queries here run through the SESSION-bound server client, meaning RLS
 * (db/002_rls.sql) is what actually restricts results to the caller's site —
 * this file does not add its own site filtering, by design, so it can never
 * accidentally under-restrict what a page shows.
 */
export async function getStaffDashboardData(siteId: string | null) {
  const supabase = createServerSupabase();

  const [installations, openTickets, outages, lowStock] = await Promise.all([
    supabase
      .from('installations')
      .select('id, ticket_number, status, created_at, customers(full_name)')
      .in('status', ['submitted', 'pending_review', 'approved'])
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('tickets')
      .select('id, ticket_number, type, subject, priority, status, created_at')
      .not('status', 'in', '(resolved,completed,cancelled)')
      .order('priority', { ascending: false })
      .limit(10),
    supabase
      .from('network_outages')
      .select('id, title, status, started_at')
      .is('resolved_at', null),
    supabase
      .from('inventory_items')
      .select('id, name, current_stock, minimum_stock, unit')
      .order('current_stock', { ascending: true })
      .limit(50),
  ]);

  const lowStockFiltered = (lowStock.data ?? []).filter((i) => i.current_stock <= i.minimum_stock);

  return {
    installations: installations.data ?? [],
    openTickets: openTickets.data ?? [],
    outages: outages.data ?? [],
    lowStockItems: lowStockFiltered,
  };
}
