'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateSiteForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    try {
      const res = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slugify(name),
          description: formData.get('description'),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not create site.');
        return;
      }
      router.refresh();
      (e.target as HTMLFormElement).reset();
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
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-950">
          Site name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. Kisii Town"
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-950">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Adding…' : 'Add site'}
      </button>
    </form>
  );
}
