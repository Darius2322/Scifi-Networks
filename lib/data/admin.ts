import { createServerSupabase } from '@/lib/supabase/server';

export async function getAdminOverview() {
  const supabase = createServerSupabase();

  const [
    sites,
    customerCount,
    activeAgentCount,
    pendingInstallations,
    openTickets,
    staffCount,
    lowStock,
    recentVouchers,
  ] = await Promise.all([
    supabase.from('sites').select('id, name, network_status, manager_id, is_active'),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('agents').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('installations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'pending_review', 'approved', 'assigned', 'scheduled']),
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '(resolved,completed,cancelled)'),
    supabase.from('app_users').select('id', { count: 'exact', head: true }).neq('role', 'agent').neq('role', 'customer'),
    supabase.from('inventory_items').select('id, name, site_id, current_stock, minimum_stock'),
    supabase
      .from('vouchers')
      .select('id, code, status, issued_at')
      .order('issued_at', { ascending: false })
      .limit(5),
  ]);

  const lowStockCount = (lowStock.data ?? []).filter((i) => i.current_stock <= i.minimum_stock).length;

  // Per-site rollups for the "Site Overview" panel (spec section 54).
  const siteRollups = await Promise.all(
    (sites.data ?? []).map(async (site) => {
      const [siteCustomers, siteOpenTickets, siteLowStock] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('site_id', site.id),
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', site.id)
          .not('status', 'in', '(resolved,completed,cancelled)'),
        supabase
          .from('inventory_items')
          .select('id, current_stock, minimum_stock')
          .eq('site_id', site.id),
      ]);

      return {
        ...site,
        customerCount: siteCustomers.count ?? 0,
        openTicketCount: siteOpenTickets.count ?? 0,
        inventoryAlertCount: (siteLowStock.data ?? []).filter((i) => i.current_stock <= i.minimum_stock).length,
      };
    })
  );

  return {
    sites: siteRollups,
    stats: {
      totalCustomers: customerCount.count ?? 0,
      activeAgents: activeAgentCount.count ?? 0,
      pendingInstallations: pendingInstallations.count ?? 0,
      openTickets: openTickets.count ?? 0,
      staffCount: staffCount.count ?? 0,
      inventoryAlerts: lowStockCount,
      activeSites: (sites.data ?? []).filter((s) => s.is_active).length,
    },
    recentVouchers: recentVouchers.data ?? [],
  };
}
