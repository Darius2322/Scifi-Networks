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

  const allOperational = sites.every((s) => s.network_status === 'operational');

  return (
    <div className="bg-surface-dark text-white/85">
      <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-2.5 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-white">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${allOperational ? 'bg-status-good' : 'bg-status-warn'}`} />
          {allOperational ? 'All systems operational' : 'Service notice'}
        </span>
        <span className="hidden sm:inline h-3 w-px bg-white/15" aria-hidden="true" />
        {sites.map((site) => (
          <span key={site.id} className="hidden sm:flex items-center gap-1.5 text-white/70">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[site.network_status] ?? 'bg-status-good'}`} />
            {site.name} — {STATUS_LABEL[site.network_status] ?? 'Operational'}
          </span>
        ))}
        <Link href="/status" className="ml-auto text-white/70 hover:text-white transition-colors font-medium">
          View Network Status →
        </Link>
      </div>
    </div>
  );
}
