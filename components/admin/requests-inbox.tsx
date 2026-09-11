'use client';

import Link from 'next/link';
import { useState } from 'react';

const INSTALLATION_STATUSES = ['submitted', 'pending_review', 'approved', 'rejected', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const TICKET_STATUSES = ['submitted', 'pending_review', 'approved', 'rejected', 'assigned', 'scheduled', 'in_progress', 'waiting_customer', 'resolved', 'completed', 'cancelled'];

export function RequestsInbox({ initialInstallations, initialTickets }: { initialInstallations: any[]; initialTickets: any[] }) {
  const [installations, setInstallations] = useState(initialInstallations);
  const [tickets, setTickets] = useState(initialTickets);

  async function updateInstallationStatus(id: string, status: string) {
    await fetch('/api/admin/installations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setInstallations((prev) => prev.filter((i) => (status === 'completed' || status === 'cancelled' || status === 'rejected' ? i.id !== id : true)).map((i) => (i.id === id ? { ...i, status } : i)));
  }

  async function updateTicketStatus(id: string, status: string) {
    await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTickets((prev) => prev.filter((t) => (['resolved', 'completed', 'cancelled'].includes(status) ? t.id !== id : true)).map((t) => (t.id === id ? { ...t, status } : t)));
  }

  return (
    <div>
      <section className="mt-8">
        <h2 className="font-medium text-ink-950">New installation requests</h2>
        <div className="mt-3 border border-ink-950/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
              <tr>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Site</th>
                <th className="p-3 font-medium">Package</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/10">
              {installations.map((inst) => {
                const customer = Array.isArray(inst.customers) ? inst.customers[0] : inst.customers;
                const site = Array.isArray(inst.sites) ? inst.sites[0] : inst.sites;
                const pkg = Array.isArray(inst.packages) ? inst.packages[0] : inst.packages;
                return (
                  <tr key={inst.id}>
                    <td className="p-3">
                      <Link href={`/wp-admin/installations/${inst.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                        {customer?.full_name ?? '—'}
                      </Link>
                      <p className="text-ink-800/50">{inst.ticket_number}</p>
                    </td>
                    <td className="p-3 text-ink-800/70">
                      {customer?.phone && <div>{customer.phone}</div>}
                      {customer?.email && <div className="text-xs text-ink-800/50">{customer.email}</div>}
                    </td>
                    <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                    <td className="p-3 text-ink-800/70">{pkg?.name ?? 'Not selected'}</td>
                    <td className="p-3">
                      <select
                        defaultValue={inst.status}
                        onChange={(e) => updateInstallationStatus(inst.id, e.target.value)}
                        className="border border-ink-950/15 bg-paper-50 px-2 py-1 text-xs"
                      >
                        {INSTALLATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {installations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-800/60">
                    No new installation requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium text-ink-950">Open tickets</h2>
        <div className="mt-3 border border-ink-950/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
              <tr>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Site</th>
                <th className="p-3 font-medium">Priority</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/10">
              {tickets.map((t) => {
                const customer = Array.isArray(t.customers) ? t.customers[0] : t.customers;
                const site = Array.isArray(t.sites) ? t.sites[0] : t.sites;
                const contactName = customer?.full_name ?? t.reporter_name ?? 'Anonymous';
                const contactDetail = customer?.phone ?? customer?.email ?? t.reporter_contact ?? null;
                return (
                  <tr key={t.id}>
                    <td className="p-3">
                      <Link href={`/wp-admin/tickets/${t.id}`} className="font-medium text-ink-950 hover:text-signal-500">
                        {t.subject}
                      </Link>
                      <p className="text-ink-800/50">{t.ticket_number}</p>
                    </td>
                    <td className="p-3 text-ink-800/70">
                      <div>{contactName}</div>
                      {contactDetail && <div className="text-xs text-ink-800/50">{contactDetail}</div>}
                    </td>
                    <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                    <td className="p-3 capitalize text-ink-800/80">{t.priority}</td>
                    <td className="p-3">
                      <select
                        defaultValue={t.status}
                        onChange={(e) => updateTicketStatus(t.id, e.target.value)}
                        className="border border-ink-950/15 bg-paper-50 px-2 py-1 text-xs"
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-800/60">
                    No open tickets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
