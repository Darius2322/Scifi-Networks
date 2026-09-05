'use client';

import { useEffect, useState } from 'react';

type Note = { id: string; note: string; author_name: string; created_at: string };

export function CustomerNotesPanel({ customerId }: { customerId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadNotes() {
    const res = await fetch(`/api/staff/customers/${customerId}/notes`);
    const json = await res.json();
    setNotes(json.notes ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await fetch(`/api/staff/customers/${customerId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: formData.get('note') }),
    });
    (e.target as HTMLFormElement).reset();
    setSubmitting(false);
    loadNotes();
  }

  return (
    <div className="border border-ink-950/10 p-5">
      <h2 className="text-sm font-medium text-ink-950">Internal notes</h2>
      {loading ? (
        <p className="mt-2 text-sm text-ink-800/60">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="mt-2 text-sm text-ink-800/60">No notes yet.</p>
      ) : (
        <ul className="mt-2 space-y-3 max-h-56 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id} className="text-sm border-b border-ink-950/5 pb-2">
              <p className="text-ink-800">{n.note}</p>
              <p className="mt-1 text-xs text-ink-800/50">
                {n.author_name} · {new Date(n.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <textarea
          name="note"
          rows={2}
          required
          placeholder="Add a note visible to staff at this site…"
          className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-60">
          {submitting ? 'Adding…' : 'Add note'}
        </button>
      </form>
    </div>
  );
}
