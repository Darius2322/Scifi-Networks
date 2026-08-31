import { redirect } from 'next/navigation';
import { getTrackSession, getTrackPortalData } from '@/lib/auth/track-session';
import { StatusTimeline } from '@/components/track/status-timeline';
import { TrackDashboardShell } from '@/components/track/track-dashboard-shell';

const STAGES = [
  'submitted',
  'pending_review',
  'approved',
  'assigned',
  'scheduled',
  'completed',
] as const;

export default async function TrackDashboardPage() {
  const session = await getTrackSession();
  if (!session) redirect('/track');

  const { installation, tickets, notifications } = await getTrackPortalData(session);
  if (!installation) redirect('/track');

  const customer = Array.isArray(installation.customers) ? installation.customers[0] : installation.customers;
  const site = Array.isArray(installation.sites) ? installation.sites[0] : installation.sites;
  const pkg = Array.isArray(installation.packages) ? installation.packages[0] : installation.packages;

  return (
    <TrackDashboardShell installationId={installation.id} customerName={customer?.full_name}>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <section className="border border-ink-950/10 p-6">
            <p className="text-sm text-ink-800/60">Ticket</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-950">{installation.ticket_number}</p>
            <dl className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-ink-800/60">Service location</dt>
                <dd className="mt-0.5 font-medium text-ink-950">{site?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-800/60">Package</dt>
                <dd className="mt-0.5 font-medium text-ink-950">{pkg?.name ?? 'Not yet assigned'}</dd>
              </div>
              <div>
                <dt className="text-ink-800/60">Requested on</dt>
                <dd className="mt-0.5 font-medium text-ink-950">
                  {new Date(installation.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </dd>
              </div>
              <div>
                <dt className="text-ink-800/60">Scheduled</dt>
                <dd className="mt-0.5 font-medium text-ink-950">
                  {installation.scheduled_at
                    ? new Date(installation.scheduled_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
                    : 'Not yet scheduled'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border border-ink-950/10 p-6">
            <h2 className="font-medium text-ink-950">Request status</h2>
            <div className="mt-5">
              <StatusTimeline currentStatus={installation.status} stages={STAGES} />
            </div>
          </section>

          <section className="border border-ink-950/10 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink-950">Your support tickets</h2>
            </div>
            {tickets.length === 0 ? (
              <p className="mt-3 text-sm text-ink-800/70">No support tickets yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink-950/10">
                {tickets.map((t) => (
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

        <aside className="space-y-6">
          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Notifications</h2>
            {notifications.length === 0 ? (
              <p className="mt-2 text-sm text-ink-800/60">Nothing new yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {notifications.slice(0, 6).map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="font-medium text-ink-950">{n.title}</p>
                    <p className="text-ink-800/70">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </TrackDashboardShell>
  );
}
