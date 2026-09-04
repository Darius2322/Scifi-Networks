'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Site = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  condition: string;
  sites: { name: string } | { name: string }[] | null;
};

export function AdminInventoryManager({ initialItems, sites }: { initialItems: Item[]; sites: Site[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [filterSite, setFilterSite] = useState('all');
  const [transferItem, setTransferItem] = useState<Item | null>(null);

  const filtered = initialItems.filter((item) => {
    if (filterSite === 'all') return true;
    const site = Array.isArray(item.sites) ? item.sites[0] : item.sites;
    return site?.name === sites.find((s) => s.id === filterSite)?.name;
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
        >
          <option value="all">All sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button onClick={() => setShowAdd((v) => !v)} className="text-sm font-medium text-signal-500 hover:text-signal-600">
          {showAdd ? 'Cancel' : '+ Add item'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 border border-ink-950/10 p-5 max-w-md">
          <AddItemForm
            sites={sites}
            onCreated={() => {
              setShowAdd(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {transferItem && (
        <div className="mb-6 border border-signal-500/30 bg-signal-500/5 p-5 max-w-md">
          <TransferForm
            item={transferItem}
            sites={sites}
            onDone={() => {
              setTransferItem(null);
              router.refresh();
            }}
            onCancel={() => setTransferItem(null)}
          />
        </div>
      )}

      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {filtered.map((item) => {
              const site = Array.isArray(item.sites) ? item.sites[0] : item.sites;
              const isLow = item.current_stock <= item.minimum_stock;
              return (
                <tr key={item.id}>
                  <td className="p-3 font-medium text-ink-950">{item.name}</td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? '—'}</td>
                  <td className="p-3 text-ink-800/60 font-mono text-xs">{item.sku}</td>
                  <td className="p-3">
                    <span className={isLow ? 'text-status-warn font-medium' : 'text-ink-950'}>
                      {item.current_stock} {item.unit}
                    </span>
                    {isLow && <span className="ml-1.5 text-xs text-status-warn">low</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setTransferItem(item)} className="text-signal-500 hover:text-signal-600">
                      Transfer to site
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-800/60">
                  No inventory items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-800/50">
        Add new stock at your main site, then use "Transfer to site" to move it out to other
        locations as needed. Every movement is recorded on both ends automatically.
      </p>
    </div>
  );
}

function TransferForm({ item, sites, onDone, onCancel }: { item: Item; sites: Site[]; onDone: () => void; onCancel: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentSiteName = Array.isArray(item.sites) ? item.sites[0]?.name : item.sites?.name;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_item_id: item.id,
          destination_site_id: formData.get('destination_site_id'),
          quantity: formData.get('quantity'),
          notes: formData.get('notes'),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not complete the transfer.');
        return;
      }
      onDone();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <h3 className="text-sm font-medium text-ink-950">
        Transfer "{item.name}" from {currentSiteName}
      </h3>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <select name="destination_site_id" required className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="">Send to site…</option>
        {sites.filter((s) => s.name !== currentSiteName).map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input
        name="quantity"
        type="number"
        step="0.01"
        min="0.01"
        max={item.current_stock}
        required
        placeholder={`Quantity (max ${item.current_stock} ${item.unit})`}
        className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
      />
      <input name="notes" placeholder="Notes (optional)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
          {submitting ? 'Transferring…' : 'Confirm transfer'}
        </button>
        <button type="button" onClick={onCancel} className="border border-ink-950/15 px-4 py-2 text-sm font-medium text-ink-950">
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddItemForm({ sites, onCreated }: { sites: Site[]; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not create item.');
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
      <input name="name" required placeholder="Item name" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500" />
      <input name="sku" required placeholder="SKU / item code" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500" />
      <input name="category" required placeholder="Category (e.g. Cables)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500" />
      <select name="site_id" required className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500">
        <option value="">Select a site</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <input name="unit" defaultValue="pcs" placeholder="Unit" className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500" />
        <input name="current_stock" type="number" placeholder="Starting qty" className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500" />
        <input name="minimum_stock" type="number" placeholder="Min level" className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500" />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Adding…' : 'Add item'}
      </button>
    </form>
  );
}
