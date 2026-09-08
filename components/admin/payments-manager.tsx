'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Customer = { id: string; full_name: string };
type Payment = {
  id: string;
  amount_kes: number;
  method: string;
  status: string;
  reference: string | null;
  created_at: string;
  customers: { full_name: string } | { full_name: string }[] | null;
};

export function PaymentsManager({ initialPayments, customers }: { initialPayments: Payment[]; customers: Customer[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setShowAdd((v) => !v)} className="text-sm font-medium text-signal-500 hover:text-signal-600">
          {showAdd ? 'Cancel' : '+ Record payment'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 border border-ink-950/10 p-5 max-w-md">
          <RecordPaymentForm
            customers={customers}
            onRecorded={() => {
              setShowAdd(false);
              router.refresh();
            }}
          />
        </div>
      )}

      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Method</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialPayments.map((p) => {
              const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
              return (
                <tr key={p.id}>
                  <td className="p-3 text-ink-950">{customer?.full_name ?? '—'}</td>
                  <td className="p-3 font-medium text-ink-950">KES {Number(p.amount_kes).toLocaleString()}</td>
                  <td className="p-3 text-ink-800/70 capitalize">{p.method}</td>
                  <td className="p-3 text-ink-800/70">{new Date(p.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</td>
                </tr>
              );
            })}
            {initialPayments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-800/60">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordPaymentForm({ customers, onRecorded }: { customers: Customer[]; onRecorded: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not record payment.');
        return;
      }
      onRecorded();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <select name="customer_id" required className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="">Select a customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name}
          </option>
        ))}
      </select>
      <input name="amount_kes" type="number" required placeholder="Amount (KES)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <select name="method" defaultValue="mpesa" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="mpesa">M-Pesa</option>
        <option value="cash">Cash</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="other">Other</option>
      </select>
      <input name="reference" placeholder="Reference (optional)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
        {submitting ? 'Recording…' : 'Record payment'}
      </button>
    </form>
  );
}
