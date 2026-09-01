'use client';

import { useState } from 'react';
import Link from 'next/link';

type Site = { id: string; name: string };
type Ticket = {
  id: string;
  ticket_number: string;
  type: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  sites: { name: string } | { name: string }[] | null;
};

const PRIORITY_STYLE: Record<string, string> = {
  low: 'text-ink-800/50',
  normal: 'text-ink-800/80',
  high: 'text-status-warn',
  critical: 'text-status-bad font-medium',
};

export function AdminTicketList({ initialTickets, sites }: { initialTickets: Ticket[]; sites: Site[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [filters, setFilters] = useState({ status: '', site_id: '', priority: '' });
  const [loading, setLoading] = useState(false);

  async function applyFilters(next: typeof filters) {
    setFilters(next);
    setLoading(true);
    const params = new URLSearchParams(Object.entries(next).filter(([, v]) => v));
    try {
      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setTickets(json.tickets);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={filters.site_id}
          onChange={(e) => applyFilters({ ...filters, site_id: e.target.value })}
          className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
        >
          <option value="">All sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
          className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {['submitted', 'pending_review', 'approved', 'assigned', 'scheduled', 'in_progress', 'waiting_customer', 'resolved', 'completed', 'cancelled', 'rejected'].map(
            (s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            )
          )}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => applyFilters({ ...filters, priority: e.target.value })}
          className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
        >
          <option value="">All priorities</option>
          {['low', 'normal', 'high', 'critical'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Ticket</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Priority</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {tickets.map((t) => {
              const site = Array.isArray(t.sites) ? t.sites[0] : t.sites;
              return (
                <tr key={t.id}>
                  <td className="p-3">
                    <Link href={`/wp-admin/tickets/${t.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                      {t.subject}
                    </Link>
                    <p className="text-ink-800/60">{t.ticket_number}</p>
                  </td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                  <td className={`p-3 capitalize ${PRIORITY_STYLE[t.priority] ?? ''}`}>{t.priority}</td>
                  <td className="p-3 capitalize text-ink-800/80">{t.status.replace('_', ' ')}</td>
                </tr>
              );
            })}
            {tickets.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-800/60">
                  No tickets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
