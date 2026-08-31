import Link from 'next/link';

type Site = { id: string; name: string; network_status: string };

const STATUS_LABEL: Record<string, string> = {
  operational: 'Operational',
  partial_outage: 'Partial Outage',
  major_outage: 'Major Outage',
  maintenance: 'Maintenance',
};

const STATUS_DOT: Record<string, string> = {
  operational: 'bg-status-good',
  partial_outage: 'bg-status-warn',
  major_outage: 'bg-status-bad',
  maintenance: 'bg-status-warn',
};

export function StatusStrip({ sites }: { sites: Site[] }) {
  if (sites.length === 0) return null;

  return (
    <div className="border-b border-ink-950/10 bg-ink-950 text-paper-100">
      <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-2.5 text-xs">
        <span className="text-paper-200/60 uppercase tracking-wide font-medium">Network status</span>
        {sites.map((site) => (
          <span key={site.id} className="flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[site.network_status] ?? 'bg-status-good'}`} />
            {site.name} — {STATUS_LABEL[site.network_status] ?? 'Operational'}
          </span>
        ))}
        <Link href="/status" className="ml-auto text-signal-400 hover:text-signal-500 transition-colors">
          Full status page
        </Link>
      </div>
    </div>
  );
}
