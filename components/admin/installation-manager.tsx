'use client';

import { useState } from 'react';

type Technician = { id: string; full_name: string; site_id: string | null };
type Installation = {
  id: string;
  ticket_number: string;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  sites: { name: string } | { name: string }[] | null;
  customers: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
  packages: { name: string } | { name: string }[] | null;
  assigned_technician_id: string | null;
};

const STATUSES = ['submitted', 'pending_review', 'approved', 'rejected', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled'];

export function InstallationManager({ initialInstallations, technicians }: { initialInstallations: Installation[]; technicians: Technician[] }) {
  const [installations, setInstallations] = useState(initialInstallations);
  const [filter, setFilter] = useState('');

  async function patch(id: string, fields: Record<string, unknown>) {
    await fetch('/api/admin/installations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    });
    setInstallations((prev) => prev.map((i) => (i.id === id ? { ...i, ...fields } as Installation : i)));
  }

  const filtered = filter ? installations.filter((i) => i.status === filter) : installations;

  return (
    <div>
      <div className="mb-5">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Ticket</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Technician</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {filtered.map((inst) => {
              const site = Array.isArray(inst.sites) ? inst.sites[0] : inst.sites;
              const customer = Array.isArray(inst.customers) ? inst.customers[0] : inst.customers;
              const pkg = Array.isArray(inst.packages) ? inst.packages[0] : inst.packages;

              return (
                <tr key={inst.id}>
                  <td className="p-3">
                    <p className="font-medium text-ink-950">{inst.ticket_number}</p>
                    <p className="text-ink-800/60">{pkg?.name ?? 'No package'}</p>
                  </td>
                  <td className="p-3 text-ink-800/70">
                    {customer?.full_name}
                    <p className="text-ink-800/50">{customer?.phone}</p>
                  </td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                  <td className="p-3">
                    <select
                      defaultValue={inst.status}
                      onChange={(e) => patch(inst.id, { status: e.target.value })}
                      className="border border-ink-950/15 bg-paper-50 px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      defaultValue={inst.assigned_technician_id ?? ''}
                      onChange={(e) => patch(inst.id, { assigned_technician_id: e.target.value || null })}
                      className="border border-ink-950/15 bg-paper-50 px-2 py-1 text-xs"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-800/60">
                  No installations match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
