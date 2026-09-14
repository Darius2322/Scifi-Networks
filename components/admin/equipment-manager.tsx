'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Site = { id: string; name: string };
type Equipment = {
  id: string;
  model: string;
  serial_number: string | null;
  mac_address: string | null;
  status: string;
  condition: string;
  sites: { name: string } | { name: string }[] | null;
  customers: { full_name: string } | { full_name: string }[] | null;
};

const STATUSES = ['in_stock', 'assigned', 'installed', 'faulty', 'under_repair', 'lost', 'retired'];
const STATUS_STYLE: Record<string, string> = {
  in_stock: 'text-ink-800/70',
  assigned: 'text-signal-500',
  installed: 'text-status-good',
  faulty: 'text-status-warn',
  under_repair: 'text-status-warn',
  lost: 'text-status-bad',
  retired: 'text-ink-800/40',
};

export function EquipmentManager({ initialEquipment, sites }: { initialEquipment: Equipment[]; sites: Site[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setShowAdd((v) => !v)} className="text-sm font-medium text-signal-500 hover:text-signal-600">
          {showAdd ? 'Cancel' : '+ Add equipment'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 border border-ink-950/10 p-5 max-w-md">
          <AddEquipmentForm
            sites={sites}
            onCreated={() => {
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
              <th className="p-3 font-medium">Model</th>
              <th className="p-3 font-medium">Serial / MAC</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Assigned to</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialEquipment.map((eq) => {
              const site = Array.isArray(eq.sites) ? eq.sites[0] : eq.sites;
              const customer = Array.isArray(eq.customers) ? eq.customers[0] : eq.customers;
              return (
                <tr key={eq.id}>
                  <td className="p-3 font-medium text-ink-950">{eq.model}</td>
                  <td className="p-3 text-ink-800/60 font-mono text-xs">
                    {eq.serial_number ?? '—'} {eq.mac_address && `· ${eq.mac_address}`}
                  </td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                  <td className="p-3 text-ink-800/70">{customer?.full_name ?? '—'}</td>
                  <td className="p-3">
                    <select
                      defaultValue={eq.status}
                      onChange={async (e) => {
                        await fetch(`/api/admin/equipment/${eq.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        router.refresh();
                      }}
                      className={`border border-ink-950/15 bg-paper-50 px-2 py-1 text-xs ${STATUS_STYLE[eq.status] ?? ''}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {initialEquipment.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-800/60">
                  No equipment recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddEquipmentForm({ sites, onCreated }: { sites: Site[]; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not add equipment.');
        return;
      }
      onCreated();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <input name="model" required placeholder="Model (e.g. TP-Link Archer C6)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <select name="site_id" required className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="">Select a site</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input name="serial_number" placeholder="Serial number (optional)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <input name="mac_address" placeholder="MAC address (optional)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
        {submitting ? 'Adding…' : 'Add equipment'}
      </button>
    </form>
  );
}
