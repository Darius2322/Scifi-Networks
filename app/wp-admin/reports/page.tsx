import { redirect } from 'next/navigation';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminReportsPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');

  const supabase = createServiceRoleClient();

  const [{ data: sites }, { data: installations }, { data: tickets }, { data: vouchers }] = await Promise.all([
    supabase.from('sites').select('id, name'),
    supabase.from('installations').select('site_id, status'),
    supabase.from('tickets').select('site_id, status, type'),
    supabase.from('vouchers').select('site_id, status'),
  ]);

  const bySite = (sites ?? []).map((site) => {
    const siteInstallations = (installations ?? []).filter((i) => i.site_id === site.id);
    const siteTickets = (tickets ?? []).filter((t) => t.site_id === site.id);
    const siteVouchers = (vouchers ?? []).filter((v) => v.site_id === site.id);

    return {
      name: site.name,
      totalInstallations: siteInstallations.length,
      completedInstallations: siteInstallations.filter((i) => i.status === 'completed').length,
      openTickets: siteTickets.filter((t) => !['resolved', 'completed', 'cancelled'].includes(t.status)).length,
      resolvedTickets: siteTickets.filter((t) => ['resolved', 'completed'].includes(t.status)).length,
      vouchersIssued: siteVouchers.length,
      vouchersUsed: siteVouchers.filter((v) => v.status === 'used').length,
    };
  });

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Reports</h1>
      <p className="mt-2 text-sm text-ink-800/70">Per-site summary across installations, tickets, and vouchers.</p>

      <div className="mt-6 border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Installations</th>
              <th className="p-3 font-medium">Completed</th>
              <th className="p-3 font-medium">Open tickets</th>
              <th className="p-3 font-medium">Resolved tickets</th>
              <th className="p-3 font-medium">Vouchers issued</th>
              <th className="p-3 font-medium">Vouchers used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {bySite.map((row) => (
              <tr key={row.name}>
                <td className="p-3 font-medium text-ink-950">{row.name}</td>
                <td className="p-3 text-ink-800/70">{row.totalInstallations}</td>
                <td className="p-3 text-ink-800/70">{row.completedInstallations}</td>
                <td className="p-3 text-ink-800/70">{row.openTickets}</td>
                <td className="p-3 text-ink-800/70">{row.resolvedTickets}</td>
                <td className="p-3 text-ink-800/70">{row.vouchersIssued}</td>
                <td className="p-3 text-ink-800/70">{row.vouchersUsed}</td>
              </tr>
            ))}
            {bySite.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink-800/60">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
