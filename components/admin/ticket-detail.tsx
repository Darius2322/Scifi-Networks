'use client';

import { useEffect, useState } from 'react';

type Props = {
  ticketId: string;
  basePath: string; // '/api/admin/tickets' or '/api/staff/tickets'
  canAssignAcrossSites?: boolean;
};

const STATUSES = [
  'submitted', 'pending_review', 'approved', 'rejected', 'assigned',
  'scheduled', 'in_progress', 'waiting_customer', 'resolved', 'completed', 'cancelled',
];
const PRIORITIES = ['low', 'normal', 'high', 'critical'];

export function TicketDetail({ ticketId, basePath }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/${ticketId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not load ticket.');
        return;
      }
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function patchTicket(fields: Record<string, unknown>) {
    await fetch(`${basePath}/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    load();
  }

  if (loading) return <p className="text-sm text-ink-800/60">Loading…</p>;
  if (error || !data) return <p className="text-sm text-status-bad">{error ?? 'Ticket not found.'}</p>;

  const { ticket, updates, eligibleStaff } = data;
  const customer = Array.isArray(ticket.customers) ? ticket.customers[0] : ticket.customers;
  const site = Array.isArray(ticket.sites) ? ticket.sites[0] : ticket.sites;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-ink-800/70">
            {ticket.ticket_number} · {site?.name ?? '—'} · {customer?.full_name ?? 'No customer on file'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          {ticket.description && (
            <div className="border border-ink-950/10 p-5">
              <h2 className="text-sm font-medium text-ink-950">Description</h2>
              <p className="mt-2 text-sm text-ink-800/80">{ticket.description}</p>
              {ticket.location_text && <p className="mt-2 text-sm text-ink-800/60">Location: {ticket.location_text}</p>}
            </div>
          )}

          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Activity</h2>
            {updates.length === 0 ? (
              <p className="mt-2 text-sm text-ink-800/60">No updates yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {updates.map((u: any) => (
                  <li key={u.id} className={u.is_internal ? 'border-l-2 border-status-warn pl-3' : 'border-l-2 border-signal-500 pl-3'}>
                    <p className="text-xs text-ink-800/50">
                      {u.author_name} · {new Date(u.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                      {u.is_internal && <span className="ml-2 text-status-warn">Internal note</span>}
                    </p>
                    <p className="mt-1 text-sm text-ink-800">{u.message}</p>
                  </li>
                ))}
              </ul>
            )}

            <AddUpdateForm basePath={basePath} ticketId={ticketId} onAdded={load} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="border border-ink-950/10 p-5">
            <h2 className="text-sm font-medium text-ink-950">Status</h2>
            <select
              defaultValue={ticket.status}
              onChange={(e) => patchTicket({ status: e.target.value })}
              className="mt-2 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>

            <h2 className="mt-4 text-sm font-medium text-ink-950">Priority</h2>
            <select
              defaultValue={ticket.priority}
              onChange={(e) => patchTicket({ priority: e.target.value })}
              className="mt-2 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {eligibleStaff && (
              <>
                <h2 className="mt-4 text-sm font-medium text-ink-950">Assigned to</h2>
                <select
                  defaultValue={ticket.assigned_to ?? ''}
                  onChange={(e) => patchTicket({ assigned_to: e.target.value || null })}
                  className="mt-2 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {eligibleStaff.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddUpdateForm({ basePath, ticketId, onAdded }: { basePath: string; ticketId: string; onAdded: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await fetch(`${basePath}/${ticketId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: formData.get('message'),
          is_internal: formData.get('is_internal') === 'on',
        }),
      });
      (e.target as HTMLFormElement).reset();
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border-t border-ink-950/10 pt-4 space-y-2">
      <textarea
        name="message"
        rows={2}
        required
        placeholder="Add an update…"
        className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-ink-800/70">
          <input type="checkbox" name="is_internal" className="h-3.5 w-3.5" />
          Internal note (not visible to customer)
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-sm bg-signal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-signal-600 disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add update'}
        </button>
      </div>
    </form>
  );
}
