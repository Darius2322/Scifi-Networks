'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Site = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  network_status: string;
  manager_id: string | null;
};

type ManagerOption = { id: string; full_name: string; role: string };

export function SiteEditForm({ site, eligibleManagers }: { site: Site; eligibleManagers: ManagerOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const managerId = formData.get('manager_id') as string;

    try {
      const res = await fetch(`/api/admin/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          is_active: formData.get('is_active') === 'on',
          network_status: formData.get('network_status'),
          manager_id: managerId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not save changes.');
        return;
      }
      setSuccess(true);
      router.refresh();
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
        <p className="border border-status-good/30 bg-status-good/5 p-2.5 text-xs text-status-good">Saved.</p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-950">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={site.name}
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-950">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={site.description ?? ''}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        />
      </div>

      <div>
        <label htmlFor="manager_id" className="block text-sm font-medium text-ink-950">
          Site manager
        </label>
        <select
          id="manager_id"
          name="manager_id"
          defaultValue={site.manager_id ?? ''}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        >
          <option value="">Unassigned</option>
          {eligibleManagers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name} ({m.role.replace('_', ' ')})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="network_status" className="block text-sm font-medium text-ink-950">
          Network status
        </label>
        <select
          id="network_status"
          name="network_status"
          defaultValue={site.network_status}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        >
          <option value="operational">Operational</option>
          <option value="partial_outage">Partial Outage</option>
          <option value="major_outage">Major Outage</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-950">
        <input type="checkbox" name="is_active" defaultChecked={site.is_active} className="h-4 w-4" />
        Site is active
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
