'use client';

import { useState } from 'react';

type Site = { id: string; name: string };

const ISSUE_TYPES = [
  { value: 'outage', label: 'No Internet / Slow Internet' },
  { value: 'coverage', label: 'No coverage in my area' },
  { value: 'equipment', label: 'Damaged equipment' },
  { value: 'complaint', label: 'Service complaint' },
  { value: 'general_support', label: 'Other' },
];

export function PublicReportIssueForm({ sites }: { sites: Site[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/public-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "We couldn't submit that. Please try again.");
        return;
      }
      setTicketNumber(json.ticket_number);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="animate-success border border-status-good/30 bg-status-good/5 p-6">
        <div className="flex items-center gap-2 text-status-good">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-medium">Report submitted</p>
        </div>
        <p className="mt-3 font-display text-2xl font-semibold text-ink-950">{ticketNumber}</p>
        <p className="mt-3 text-sm text-ink-800/80">
          Save this ticket number — you can reference it if you contact us for an update.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-3 text-sm text-status-bad">
          {error}
        </p>
      )}

      <Field label="Your name" name="reporter_name" required />
      <Field label="Phone or email (optional)" name="reporter_contact" />

      <div>
        <label htmlFor="site_id" className="block text-sm font-medium text-ink-950">
          Service location
        </label>
        <select
          id="site_id"
          name="site_id"
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        >
          <option value="">Select a location</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-ink-950">
          What's the issue?
        </label>
        <select
          id="type"
          name="type"
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        >
          {ISSUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <Field label="Location or landmark (optional)" name="location_text" />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-950">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-sm bg-signal-500 px-5 py-3 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  );
}

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-950">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
      />
    </div>
  );
}
