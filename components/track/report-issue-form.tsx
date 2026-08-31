'use client';

import { useState } from 'react';

const ISSUE_TYPES = [
  { value: 'outage', label: 'No Internet' },
  { value: 'outage', label: 'Slow Internet' },
  { value: 'outage', label: 'Intermittent connection' },
  { value: 'equipment', label: 'Router problem' },
  { value: 'coverage', label: 'Weak or no coverage in my area' },
  { value: 'general_support', label: 'Other' },
];

export function ReportIssueForm({ installationId }: { installationId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const [type, subject] = (formData.get('issue_option') as string).split('|');

    try {
      const res = await fetch('/api/track/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installation_id: installationId,
          type,
          subject,
          description: formData.get('description'),
          location_text: formData.get('location_text'),
        }),
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
      <div className="border border-status-good/30 bg-status-good/5 p-6">
        <p className="text-sm font-medium text-status-good">Report received</p>
        <p className="mt-2 font-display text-xl font-semibold text-ink-950">{ticketNumber}</p>
        <p className="mt-2 text-sm text-ink-800/80">We'll update this in your dashboard as it progresses.</p>
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

      <div>
        <label htmlFor="issue_option" className="block text-sm font-medium text-ink-950">
          What's the issue?
        </label>
        <select
          id="issue_option"
          name="issue_option"
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        >
          {ISSUE_TYPES.map((opt) => (
            <option key={opt.label} value={`${opt.value}|${opt.label}`}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

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

      <div>
        <label htmlFor="location_text" className="block text-sm font-medium text-ink-950">
          Location (optional)
        </label>
        <input
          id="location_text"
          name="location_text"
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
