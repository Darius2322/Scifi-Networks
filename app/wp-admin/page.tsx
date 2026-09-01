import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppUserSession, ADMIN_ROLES } from '@/lib/auth/app-session';
import { getAdminOverview } from '@/lib/data/admin';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminOverviewPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/wp-admin/login');
  if (!ADMIN_ROLES.includes(session.role)) redirect('/wp-admin/login');
  if (session.must_change_password) redirect('/staff/change-password');

  const { sites, stats, recentVouchers } = await getAdminOverview();

  return (
    <AdminShell fullName={session.full_name}>
      <h1 className="font-display text-2xl font-semibold text-ink-950">Overview</h1>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <Stat label="Total customers" value={stats.totalCustomers} />
        <Stat label="Pending installations" value={stats.pendingInstallations} />
        <Stat label="Open tickets" value={stats.openTickets} />
        <Stat label="Active agents" value={stats.activeAgents} />
        <Stat label="Active sites" value={stats.activeSites} />
        <Stat label="Staff" value={stats.staffCount} />
        <Stat label="Inventory alerts" value={stats.inventoryAlerts} warn={stats.inventoryAlerts > 0} />
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-ink-950">Sites</h2>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        {sites.map((site) => (
          <Link
            key={site.id}
            href={`/wp-admin/sites/${site.id}`}
            className="border border-ink-950/10 p-5 hover:border-signal-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink-950">{site.name}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-sm ${
                  site.network_status === 'operational'
                    ? 'bg-status-good/10 text-status-good'
                    : 'bg-status-warn/10 text-status-warn'
                }`}
              >
                {site.network_status.replace('_', ' ')}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-ink-800/50 text-xs">Customers</dt>
                <dd className="font-medium text-ink-950">{site.customerCount}</dd>
              </div>
              <div>
                <dt className="text-ink-800/50 text-xs">Open tickets</dt>
                <dd className="font-medium text-ink-950">{site.openTicketCount}</dd>
              </div>
              <div>
                <dt className="text-ink-800/50 text-xs">Inventory alerts</dt>
                <dd className="font-medium text-ink-950">{site.inventoryAlertCount}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-ink-950">Recent voucher activity</h2>
      <div className="mt-4 border border-ink-950/10">
        {recentVouchers.length === 0 ? (
          <p className="p-5 text-sm text-ink-800/60">No vouchers issued yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
              <tr>
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/10">
              {recentVouchers.map((v: any) => (
                <tr key={v.id}>
                  <td className="p-3 font-medium text-ink-950">{v.code}</td>
                  <td className="p-3 capitalize">{v.status}</td>
                  <td className="p-3 text-ink-800/70">
                    {new Date(v.issued_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="border border-ink-950/10 p-4">
      <p className={`font-display text-2xl font-semibold ${warn ? 'text-status-warn' : 'text-ink-950'}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-800/60">{label}</p>
    </div>
  );
}
