'use client';

import { useState } from 'react';

type Requirement = { id: string; title: string; description: string | null };

export function HotspotRequirementsManager({ initialRequirements }: { initialRequirements: Requirement[] }) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/hotspot-requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    if (res.ok) {
      const refreshed = await fetch('/api/admin/hotspot-requirements').then((r) => r.json());
      setRequirements(refreshed.requirements ?? []);
      (e.target as HTMLFormElement).reset();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/hotspot-requirements/${id}`, { method: 'DELETE' });
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="border border-ink-950/10 p-5">
      <h2 className="font-medium text-ink-950">Hotspot requirements</h2>
      <p className="mt-1 text-xs text-ink-800/50">Shown to customers on the public Hotspot page.</p>

      <ul className="mt-4 divide-y divide-ink-950/10">
        {requirements.map((r) => (
          <li key={r.id} className="py-2 flex items-center justify-between text-sm">
            <span className="text-ink-950">{r.title}</span>
            <button onClick={() => handleDelete(r.id)} className="text-status-bad hover:text-status-bad/80">
              Remove
            </button>
          </li>
        ))}
        {requirements.length === 0 && <li className="py-2 text-sm text-ink-800/60">None yet.</li>}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input name="title" required placeholder="e.g. Valid ID" className="flex-1 border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
        <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
          Add
        </button>
      </form>
    </div>
  );
}
