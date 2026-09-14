'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Site = { id: string; name: string };
type Notice = {
  id: string;
  title: string;
  description: string | null;
  affected_service: string | null;
  priority: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  is_published: boolean;
  sites: { name: string } | { name: string }[] | null;
};

export function MaintenanceManager({ initialNotices, sites }: { initialNotices: Notice[]; sites: Site[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setShowCreate((v) => !v)} className="text-sm font-medium text-signal-500 hover:text-signal-600">
          {showCreate ? 'Cancel' : '+ Create notice'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 border border-ink-950/10 p-5 max-w-lg">
          <CreateNoticeForm
            sites={sites}
            onCreated={() => {
              setShowCreate(false);
              router.refresh();
            }}
          />
        </div>
      )}

      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Notice</th>
              <th className="p-3 font-medium">Site</th>
              <th className="p-3 font-medium">Starts</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialNotices.map((n) => {
              const site = Array.isArray(n.sites) ? n.sites[0] : n.sites;
              return (
                <tr key={n.id}>
                  <td className="p-3">
                    <p className="font-medium text-ink-950">{n.title}</p>
                    <p className="text-ink-800/60 capitalize">{n.priority} priority</p>
                  </td>
                  <td className="p-3 text-ink-800/70">{site?.name ?? 'All sites'}</td>
                  <td className="p-3 text-ink-800/70">{new Date(n.starts_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="p-3 capitalize text-ink-800/80">{n.status.replace('_', ' ')}</td>
                  <td className="p-3 text-right whitespace-nowrap space-x-3">
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/maintenance/${n.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_published: !n.is_published }),
                        });
                        router.refresh();
                      }}
                      className="text-signal-500 hover:text-signal-600"
                    >
                      {n.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Delete this notice?')) return;
                        await fetch(`/api/admin/maintenance/${n.id}`, { method: 'DELETE' });
                        router.refresh();
                      }}
                      className="text-status-bad hover:text-status-bad/80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {initialNotices.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink-800/60">
                  No maintenance notices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateNoticeForm({ sites, onCreated }: { sites: Site[]; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(formData.entries()), is_published: formData.get('is_published') === 'on' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not create notice.');
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
      <input name="title" required placeholder="e.g. Maintenance in Kemera Stage" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <textarea name="description" rows={3} placeholder="Description" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <select name="site_id" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="">All sites</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input name="affected_service" placeholder="Affected service (optional)" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      <select name="priority" defaultValue="normal" className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm">
        <option value="low">Low priority</option>
        <option value="normal">Normal priority</option>
        <option value="high">High priority</option>
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input name="starts_at" type="datetime-local" required className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
        <input name="ends_at" type="datetime-local" className="border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-950">
        <input type="checkbox" name="is_published" className="h-4 w-4" />
        Publish immediately
      </label>
      <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
        {submitting ? 'Creating…' : 'Create notice'}
      </button>
    </form>
  );
}
