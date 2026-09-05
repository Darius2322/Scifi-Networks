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

export default async function StatusPage() {
  const [sites, outages, maintenanceNotices] = await Promise.all([
    getActiveSites(),
    getActiveOutagesBySite(),
    getActiveMaintenanceNotices(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Network Status</h1>
        <p className="mt-2 text-ink-800/80">
          Live status for every SciFi Networks service location. This page updates automatically.
        </p>

        <div className="mt-10 space-y-3">
          {sites.length === 0 ? (
            <p className="text-sm text-ink-800/60">Status information is not available right now.</p>
          ) : (
            sites.map((site) => (
              <div key={site.id} id={site.slug} className="flex items-center justify-between border border-ink-950/10 p-4">
                <p className="font-medium text-ink-950">{site.name}</p>
                <span className={`text-xs px-2.5 py-1 rounded-sm font-medium ${STATUS_STYLE[site.network_status] ?? STATUS_STYLE.operational}`}>
                  {STATUS_LABEL[site.network_status] ?? 'Operational'}
                </span>
              </div>
            ))
          )}
        </div>

        {maintenanceNotices.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-ink-950">Scheduled maintenance</h2>
            <div className="mt-4 space-y-4">
              {maintenanceNotices.map((notice: any) => {
                const site = Array.isArray(notice.sites) ? notice.sites[0] : notice.sites;
                return (
                  <div key={notice.id} className="border border-signal-500/30 bg-signal-500/5 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-ink-950">{notice.title}</p>
                      <span className="text-xs uppercase tracking-wide text-signal-500">{notice.status.replace('_', ' ')}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-800/70">
                      {site?.name ?? 'All sites'}
                      {notice.affected_service && ` · ${notice.affected_service}`}
                    </p>
                    {notice.description && <p className="mt-2 text-sm text-ink-800/80">{notice.description}</p>}
                    <p className="mt-2 text-sm text-ink-800/60">
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
            <h2 className="font-display text-xl font-semibold text-ink-950">Active incidents</h2>
            <div className="mt-4 space-y-4">
              {outages.map((outage) => {
                const site = sites.find((s) => s.id === outage.site_id);
                return (
                  <div key={outage.id} className="border border-status-warn/30 bg-status-warn/5 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-ink-950">
                        {outage.title} {site && <span className="text-ink-800/60">— {site.name}</span>}
                      </p>
                      <span className="text-xs uppercase tracking-wide text-status-warn">
                        {outage.status.replace('_', ' ')}
                      </span>
                    </div>
                    {outage.affected_area && (
                      <p className="mt-1.5 text-sm text-ink-800/70">Affected area: {outage.affected_area}</p>
                    )}
                    <p className="mt-1.5 text-sm text-ink-800/70">
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
          <p className="mt-10 text-sm text-status-good">All systems operational. No active incidents reported.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
