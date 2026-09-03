'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CustomerDetailPanel({ customer, installations, tickets, payments, agent, lastVoucher }: any) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const site = Array.isArray(customer.sites) ? customer.sites[0] : customer.sites;

  async function toggleSuspend() {
    const confirmed = window.confirm(customer.is_suspended ? 'Reactivate this customer account?' : 'Pause this customer account?');
    if (!confirmed) return;
    setSubmitting(true);
    await fetch(`/api/admin/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_suspended: !customer.is_suspended }),
    });
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm('Permanently delete this customer? This cannot be undone.');
    if (!confirmed) return;
    setSubmitting(true);
    await fetch(`/api/admin/customers/${customer.id}/delete`, { method: 'DELETE' });
    router.push('/wp-admin/customers');
  }

  async function resendVoucher() {
    if (!lastVoucher) return;
    await fetch(`/api/admin/vouchers/${lastVoucher.id}/resend`, { method: 'POST' });
    window.alert('Voucher reminder sent.');
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await fetch(`/api/admin/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    setSubmitting(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{customer.full_name}</h1>
          <p className="mt-1 text-sm text-ink-800/70">
            {customer.phone} {customer.email && `· ${customer.email}`} · {site?.name ?? 'No site'}
          </p>
          <p className="mt-1 text-xs text-ink-800/50">
            Joined {new Date(customer.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
            {customer.is_agent && <span className="ml-2 text-signal-500">Agent</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing((v) => !v)} className="border border-ink-950/15 px-4 py-2 text-sm font-medium text-ink-950">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={toggleSuspend}
            disabled={submitting}
            className={`px-4 py-2 text-sm font-medium ${customer.is_suspended ? 'bg-status-good/10 text-status-good' : 'bg-status-warn/10 text-status-warn'}`}
          >
            {customer.is_suspended ? 'Reactivate' : 'Pause'}
          </button>
          <button onClick={handleDelete} disabled={submitting} className="bg-status-bad/10 px-4 py-2 text-sm font-medium text-status-bad">
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={handleEditSubmit} className="mt-5 border border-ink-950/10 p-5 grid sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-ink-950">Full name</label>
            <input name="full_name" defaultValue={customer.full_name} className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-950">Phone</label>
            <input name="phone" defaultValue={customer.phone ?? ''} className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-950">Email</label>
            <input name="email" defaultValue={customer.email ?? ''} className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-950">Estate / area</label>
            <input name="estate_area" defaultValue={customer.estate_area ?? ''} className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={submitting} className="sm:col-span-2 bg-signal-500 text-white py-2 text-sm font-medium">
            Save changes
          </button>
        </form>
      )}

      {agent && (
        <div className="mt-6 border border-ink-950/10 p-5 max-w-xl">
          <h2 className="text-sm font-medium text-ink-950">Agent voucher status</h2>
          {lastVoucher ? (
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-950">{lastVoucher.code}</p>
                <p className="text-sm text-ink-800/60 capitalize">
                  {lastVoucher.status} · issued {new Date(lastVoucher.issued_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  {lastVoucher.expires_at && ` · expires ${new Date(lastVoucher.expires_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}`}
                </p>
              </div>
              <button onClick={resendVoucher} className="text-sm font-medium text-signal-500 hover:text-signal-600">
                Resend
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-800/60">No vouchers issued yet.</p>
          )}
          <p className="mt-3 text-xs text-ink-800/50">
            Auto-issuance: {agent.auto_issue_vouchers ? `On (every ${agent.voucher_duration_days} days)` : 'Off'} — manage from the Agents page.
          </p>
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <ListPanel title="Installations" items={installations} render={(i: any) => (
          <>
            <p className="font-medium text-ink-950">{i.ticket_number}</p>
            <p className="text-ink-800/60 capitalize">{i.status.replace('_', ' ')}</p>
          </>
        )} />
        <ListPanel title="Tickets" items={tickets} render={(t: any) => (
          <>
            <p className="font-medium text-ink-950">{t.subject}</p>
            <p className="text-ink-800/60">{t.ticket_number} · {t.status.replace('_', ' ')}</p>
          </>
        )} />
        <ListPanel title="Payments" items={payments} render={(p: any) => (
          <>
            <p className="font-medium text-ink-950">KES {Number(p.amount_kes).toLocaleString()}</p>
            <p className="text-ink-800/60 capitalize">{p.method} · {p.status}</p>
          </>
        )} />
      </div>
    </div>
  );
}

function ListPanel({ title, items, render }: { title: string; items: any[]; render: (item: any) => React.ReactNode }) {
  return (
    <div className="border border-ink-950/10 p-5">
      <h2 className="text-sm font-medium text-ink-950">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-ink-800/60">Nothing yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-ink-950/10">
          {items.map((item) => (
            <li key={item.id} className="py-2.5 text-sm">
              {render(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
