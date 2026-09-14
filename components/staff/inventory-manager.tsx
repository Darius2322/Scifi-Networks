'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Item = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  condition: string;
};

const ACTIONS = [
  { value: 'add', label: 'Add stock' },
  { value: 'remove', label: 'Remove stock' },
  { value: 'issue', label: 'Issue for a job' },
  { value: 'return', label: 'Return stock' },
  { value: 'transfer', label: 'Transfer out' },
  { value: 'adjust', label: 'Adjust to exact count' },
  { value: 'mark_damaged', label: 'Mark damaged' },
  { value: 'mark_lost', label: 'Mark lost' },
];

export function InventoryManager({
  initialItems,
  canManageStock,
  siteId,
}: {
  initialItems: Item[];
  canManageStock: boolean;
  siteId: string | null;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  return (
    <div>
      {canManageStock && (
        <div className="mb-5 flex justify-end">
          <button
            onClick={() => setShowAddItem((v) => !v)}
            className="text-sm font-medium text-signal-500 hover:text-signal-600"
          >
            {showAddItem ? 'Cancel' : '+ Add new item'}
          </button>
        </div>
      )}

      {showAddItem && (
        <div className="mb-6 border border-ink-950/10 p-5 max-w-md">
          <AddItemForm
            onCreated={() => {
              setShowAddItem(false);
              router.refresh();
            }}
          />
        </div>
      )}

      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                canManageStock={canManageStock}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onChanged={() => router.refresh()}
              />
            ))}
            {initialItems.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-800/60">
                  No inventory items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  canManageStock,
  isExpanded,
  onToggle,
  onChanged,
}: {
  item: Item;
  canManageStock: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const isLow = item.current_stock <= item.minimum_stock;

  return (
    <>
      <tr>
        <td className="p-3 font-medium text-ink-950">{item.name}</td>
        <td className="p-3 text-ink-800/60 font-mono text-xs">{item.sku}</td>
        <td className="p-3">
          <span className={isLow ? 'text-status-warn font-medium' : 'text-ink-950'}>
            {item.current_stock} {item.unit}
          </span>
          {isLow && <span className="ml-1.5 text-xs text-status-warn">low</span>}
        </td>
        <td className="p-3 text-right">
          <button onClick={onToggle} className="text-signal-500 hover:text-signal-600">
            {isExpanded ? 'Close' : canManageStock ? 'Record movement' : 'View history'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className="p-4 bg-paper-100">
            <ItemDetail item={item} canManageStock={canManageStock} onChanged={onChanged} />
          </td>
        </tr>
      )}
    </>
  );
}

function ItemDetail({ item, canManageStock, onChanged }: { item: Item; canManageStock: boolean; onChanged: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetch(`/api/staff/inventory/${item.id}/transactions`)
      .then((r) => r.json())
      .then((json) => setHistory(json.transactions ?? []))
      .finally(() => setLoadingHistory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/staff/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          action: formData.get('action'),
          quantity: formData.get('quantity'),
          reason: formData.get('reason'),
          notes: formData.get('notes'),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not record that movement.');
        return;
      }
      (e.target as HTMLFormElement).reset();
      onChanged();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
      {canManageStock && (
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <h3 className="text-sm font-medium text-ink-950">Record a movement</h3>
          {error && <p className="text-xs text-status-bad">{error}</p>}
          <select
            name="action"
            required
            className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder={`Quantity (${item.unit})`}
            className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
          />
          <input
            name="reason"
            placeholder="Reason (e.g. installation SCIFI-INS-...)"
            className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
          />
          <textarea
            name="notes"
            rows={2}
            placeholder="Notes (optional)"
            className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Recording…' : 'Record movement'}
          </button>
        </form>
      )}

      <div>
        <h3 className="text-sm font-medium text-ink-950">Recent history</h3>
        {loadingHistory ? (
          <p className="mt-2 text-xs text-ink-800/50">Loading…</p>
        ) : !history || history.length === 0 ? (
          <p className="mt-2 text-xs text-ink-800/50">No movements recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 max-h-64 overflow-y-auto">
            {history.map((t) => (
              <li key={t.id} className="text-xs text-ink-800/80 border-b border-ink-950/5 pb-2">
                <span className="font-medium text-ink-950 capitalize">{t.action.replace('_', ' ')}</span>{' '}
                {t.quantity} {item.unit} by {t.performed_by_name} · balance {t.balance_after}
                {t.reason && <span className="block text-ink-800/60">{t.reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddItemForm({ onCreated }: { onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/staff/inventory/items', {
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
