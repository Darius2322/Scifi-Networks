'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Agent = { id: string; customers: { full_name: string } | { full_name: string }[] | null };
type Voucher = {
  id: string;
  code: string;
  status: string;
  value_kes: number | null;
  issued_at: string;
  expires_at: string | null;
  agents: any;
};

const STATUS_STYLE: Record<string, string> = {
  available: 'text-status-good',
  used: 'text-ink-800/50',
  expired: 'text-status-warn',
  cancelled: 'text-status-bad',
};

export function VoucherManager({ initialVouchers, agents }: { initialVouchers: Voucher[]; agents: Agent[] }) {
  const router = useRouter();

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Agent</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Issued</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialVouchers.map((v) => {
              const agentName = Array.isArray(v.agents?.customers)
                ? v.agents?.customers[0]?.full_name
                : v.agents?.customers?.full_name;
              return (
                <tr key={v.id}>
                  <td className="p-3 font-medium text-ink-950">{v.code}</td>
                  <td className="p-3 text-ink-800/70">{agentName ?? '—'}</td>
                  <td className={`p-3 capitalize ${STATUS_STYLE[v.status] ?? ''}`}>{v.status}</td>
                  <td className="p-3 text-ink-800/70">
                    {new Date(v.issued_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap space-x-3">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(v.code);
                        window.alert('Voucher code copied — share it however you like.');
                      }}
                      className="text-signal-500 hover:text-signal-600"
                    >
                      Share
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/vouchers/${v.id}/resend`, { method: 'POST' });
                        window.alert('Reminder sent.');
                      }}
                      className="text-signal-500 hover:text-signal-600"
                    >
                      Resend
                    </button>
                    {v.status === 'available' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Cancel this voucher?')) return;
                          await fetch(`/api/admin/vouchers/${v.id}`, { method: 'DELETE' });
                          location.reload();
                        }}
                        className="text-status-bad hover:text-status-bad/80"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {initialVouchers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-800/60">
                  No vouchers issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-ink-950/10 p-5 h-fit">
        <h2 className="font-medium text-ink-950">Issue a voucher</h2>
        <div className="mt-4">
          <IssueVoucherForm agents={agents} onIssued={() => router.refresh()} />
        </div>
      </div>
    </div>
  );
}

function IssueVoucherForm({ agents, onIssued }: { agents: Agent[]; onIssued: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not issue voucher.');
        return;
      }
      setSuccess(`Voucher issued: ${json.code}`);
      (e.target as HTMLFormElement).reset();
      onIssued();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-2.5 text-xs text-status-bad">
          {error}
        </p>
      )}
      {success && (
        <p className="border border-status-good/30 bg-status-good/5 p-2.5 text-xs text-status-good">{success}</p>
      )}

      <div>
        <label htmlFor="agent_id" className="block text-sm font-medium text-ink-950">
          Agent
        </label>
        <select
          id="agent_id"
          name="agent_id"
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        >
          <option value="">Select an agent</option>
          {agents.map((a) => {
            const name = Array.isArray(a.customers) ? a.customers[0]?.full_name : a.customers?.full_name;
            return (
              <option key={a.id} value={a.id}>
                {name}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label htmlFor="value_kes" className="block text-sm font-medium text-ink-950">
          Value (KES, optional)
        </label>
        <input
          id="value_kes"
          name="value_kes"
          type="number"
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        />
      </div>

      <div>
        <label htmlFor="expires_at" className="block text-sm font-medium text-ink-950">
          Expires on (optional)
        </label>
        <input
          id="expires_at"
          name="expires_at"
          type="date"
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Issuing…' : 'Issue voucher'}
      </button>
    </form>
  );
}
