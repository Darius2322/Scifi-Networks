import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActiveSites, getActiveOutagesBySite, getActiveMaintenanceNotices } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'Network Status',
  description: 'Live network status for all SciFi Networks service locations.',
};

export const revalidate = 30;

const STATUS_LABEL: Record<string, string> = {
  operational: 'Operational',
  partial_outage: 'Partial Outage',
  major_outage: 'Major Outage',
  maintenance: 'Maintenance',
};

const STATUS_STYLE: Record<string, string> = {
  operational: 'bg-status-good/10 text-status-good',
  partial_outage: 'bg-status-warn/10 text-status-warn',
  major_outage: 'bg-status-bad/10 text-status-bad',
  maintenance: 'bg-status-warn/10 text-status-warn',
};

const STATUS_DOT: Record<string, string> = {
  operational: 'bg-status-good',
  partial_outage: 'bg-status-warn',
  major_outage: 'bg-status-bad',
  maintenance: 'bg-status-warn',
};

export default async function StatusPage() {
  const [sites, outages, maintenanceNotices] = await Promise.all([
    getActiveSites(),
    getActiveOutagesBySite(),
    getActiveMaintenanceNotices(),
  ]);

  const allOperational = sites.length > 0 && sites.every((s) => s.network_status === 'operational');

  return (
    <>
      <SiteHeader />
      <main className="container-page section-py max-w-3xl">
        <p className="eyebrow">Network Status</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink-950">Network Status</h1>
        <p className="mt-2 text-ink-700">
          Live status for every SciFi Networks service location. This page updates automatically.
        </p>

        {sites.length > 0 && (
          <div
            className={`mt-6 inline-flex items-center gap-2 badge ${
              allOperational ? 'bg-status-good/10 text-status-good' : 'bg-status-warn/10 text-status-warn'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${allOperational ? 'bg-status-good' : 'bg-status-warn'}`} />
            {allOperational ? 'All systems operational' : 'Some locations have an active notice'}
          </div>
        )}

        <div className="mt-8 card divide-y divide-paper-200">
          {sites.length === 0 ? (
            <p className="p-5 text-sm text-ink-700">Status information is not available right now.</p>
          ) : (
            sites.map((site) => (
              <div key={site.id} id={site.slug} className="flex items-center justify-between px-5 py-4">
                <p className="flex items-center gap-2.5 font-medium text-ink-950">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[site.network_status] ?? 'bg-status-good'}`} />
                  {site.name}
                </p>
                <span className={`badge ${STATUS_STYLE[site.network_status] ?? STATUS_STYLE.operational}`}>
                  {STATUS_LABEL[site.network_status] ?? 'Operational'}
                </span>
              </div>
            ))
          )}
        </div>

        {maintenanceNotices.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-ink-950">Scheduled maintenance</h2>
            <div className="mt-4 space-y-4">
              {maintenanceNotices.map((notice: any) => {
                const site = Array.isArray(notice.sites) ? notice.sites[0] : notice.sites;
                return (
                  <div key={notice.id} className="card border-signal-500/30 bg-signal-500/5 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-ink-950">{notice.title}</p>
                      <span className="text-xs uppercase tracking-wide text-signal-500 font-semibold whitespace-nowrap">
                        {notice.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-700">
                      {site?.name ?? 'All sites'}
                      {notice.affected_service && ` · ${notice.affected_service}`}
                    </p>
                    {notice.description && <p className="mt-2 text-sm text-ink-800">{notice.description}</p>}
                    <p className="mt-2 text-sm text-ink-700">
                      Starts {new Date(notice.starts_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                      {notice.ends_at && ` · Expected end ${new Date(notice.ends_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {outages.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink-950">Active incidents</h2>
            <div className="mt-4 space-y-4">
              {outages.map((outage) => {
                const site = sites.find((s) => s.id === outage.site_id);
                return (
                  <div key={outage.id} className="card border-status-warn/30 bg-status-warn/5 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-ink-950">
                        {outage.title} {site && <span className="text-ink-700">— {site.name}</span>}
                      </p>
                      <span className="text-xs uppercase tracking-wide text-status-warn font-semibold whitespace-nowrap">
                        {outage.status.replace('_', ' ')}
                      </span>
                    </div>
                    {outage.affected_area && (
                      <p className="mt-1.5 text-sm text-ink-700">Affected area: {outage.affected_area}</p>
                    )}
                    <p className="mt-1.5 text-sm text-ink-700">
                      Started {new Date(outage.started_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                      {outage.expected_resolution_at &&
                        ` · Expected resolution ${new Date(outage.expected_resolution_at).toLocaleString('en-KE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {outages.length === 0 && sites.length > 0 && (
          <p className="mt-10 text-sm font-medium text-status-good">All systems operational. No active incidents reported.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
