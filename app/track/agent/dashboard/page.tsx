import { redirect } from 'next/navigation';
import { getAppUserSession } from '@/lib/auth/app-session';
import { getAgentDashboardData } from '@/lib/data/agent';
import { AgentShell } from '@/components/track/agent-shell';

const VOUCHER_STYLES: Record<string, string> = {
  available: 'bg-status-good/10 text-status-good',
  used: 'bg-ink-950/5 text-ink-800/60',
  expired: 'bg-status-warn/10 text-status-warn',
  cancelled: 'bg-status-bad/10 text-status-bad',
};

export default async function AgentDashboardPage() {
  const session = await getAppUserSession();
  if (!session) redirect('/track/agent');
  if (session.role !== 'agent') redirect('/track/agent');
  if (session.must_change_password) redirect('/staff/change-password');

  const { agent, vouchers, tickets } = await getAgentDashboardData(session.id);
  if (!agent) redirect('/track/agent');

  const site = Array.isArray(agent.sites) ? agent.sites[0] : agent.sites;
  const customer = Array.isArray(agent.customers) ? agent.customers[0] : agent.customers;
  const latestVoucher = vouchers.find((v) => v.status === 'available');

  return (
    <AgentShell fullName={customer?.full_name ?? session.full_name}>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <section className="border border-ink-950/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-800/60">Site</p>
                <p className="font-display text-xl font-semibold text-ink-950">{site?.name ?? '—'}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-sm ${
                  site?.network_status === 'operational'
                    ? 'bg-status-good/10 text-status-good'
                    : 'bg-status-warn/10 text-status-warn'
                }`}
              >
                {(site?.network_status ?? 'operational').replace('_', ' ')}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-800/70">{agent.physical_location}</p>
          </section>

          <section className="border border-ink-950/10 p-6">
            <h2 className="font-medium text-ink-950">Your responsibilities</h2>
            <ul className="mt-3 space-y-2">
              {(agent.responsibilities ?? []).map((r: string) => (
                <li key={r} className="flex gap-2 text-sm text-ink-800">
                  <span className="text-signal-500">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-ink-950/10 p-6">
            <h2 className="font-medium text-ink-950">Voucher history</h2>
            {vouchers.length === 0 ? (
              <p className="mt-3 text-sm text-ink-800/60">No vouchers issued yet.</p>
            ) : (
              <table className="mt-4 w-full text-sm">
                <thead className="border-b border-ink-950/10 text-left text-ink-800/50">
                  <tr>
                    <th className="pb-2 font-medium">Code</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Issued</th>
                    <th className="pb-2 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/10">
                  {vouchers.map((v: any) => (
                    <tr key={v.id}>
                      <td className="py-2.5 font-medium text-ink-950">{v.code}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-sm capitalize ${VOUCHER_STYLES[v.status] ?? ''}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-ink-800/70">
                        {new Date(v.issued_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                      </td>
                      <td className="py-2.5 text-ink-800/70">
                        {v.expires_at ? new Date(v.expires_at).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="border border-ink-950/10 p-6">
            <h2 className="font-medium text-ink-950">Your reports</h2>
            {tickets.length === 0 ? (
              <p className="mt-3 text-sm text-ink-800/60">No reports submitted yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink-950/10">
                {tickets.map((t: any) => (
                  <li key={t.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-ink-950">{t.subject}</p>
                      <p className="text-ink-800/60">{t.ticket_number}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-ink-800/70">{t.status.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Latest available voucher</h2>
            {latestVoucher ? (
              <div className="mt-3">
                <p className="font-display text-lg font-semibold text-ink-950">{latestVoucher.code}</p>
                {latestVoucher.value_kes && (
                  <p className="text-sm text-ink-800/70">KES {Number(latestVoucher.value_kes).toLocaleString()}</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-800/60">No available vouchers right now.</p>
            )}
          </div>
        </aside>
      </div>
    </AgentShell>
  );
}
