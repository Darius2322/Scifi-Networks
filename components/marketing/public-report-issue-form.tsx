'use client';

import { useState } from 'react';
import { PhotoUpload } from '@/components/ui/photo-upload';

type Site = { id: string; name: string };

const ISSUE_TYPES = [
  { value: 'outage', label: 'Internet is down / slow' },
  { value: 'coverage', label: 'No coverage in my area' },
  { value: 'equipment', label: 'Router / equipment problem' },
  { value: 'complaint', label: 'Service complaint' },
  { value: 'general_support', label: 'Other' },
];

export function PublicReportIssueForm({ sites }: { sites: Site[] }) {
  const [type, setType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [attachmentToken, setAttachmentToken] = useState<string | null>(null);

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
      setTicketId(json.ticket_id);
      setAttachmentToken(json.attachment_token);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="animate-success card border-status-good/30 bg-status-good/5 p-6">
        <div className="flex items-center gap-2 text-status-good">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-semibold">Report submitted</p>
        </div>
        <p className="mt-3 font-display text-2xl font-bold text-ink-950">{ticketNumber}</p>
        <p className="mt-3 text-sm text-ink-800">
          Save this ticket number — you can reference it if you contact us for an update.
        </p>
        {ticketId && <PhotoUpload ticketId={ticketId} attachmentToken={attachmentToken ?? undefined} />}
      </div>
    );
  }

  // STEP 1 — approachable, low-commitment entry point instead of a form
  // wall. Tapping a tile sets the same `type` value the select used to
  // submit; nothing about the data submitted or its destination changes.
  if (!type) {
    return (
      <div className="card p-6 sm:p-8">
        <p className="text-sm font-medium text-ink-950">What's going on?</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {ISSUE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className="card card-hover text-left p-4 text-sm font-medium text-ink-950 hover:border-signal-500/40"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8" noValidate>
      <input type="hidden" name="type" value={type} />

      <div className="flex items-center justify-between">
        <span className="badge bg-signal-500/10 text-signal-500">
          {ISSUE_TYPES.find((t) => t.value === type)?.label}
        </span>
        <button type="button" onClick={() => setType(null)} className="text-xs font-medium text-ink-700 hover:text-signal-500">
          Change
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-status-bad/30 bg-status-bad/5 p-3 text-sm text-status-bad">
          {error}
        </p>
      )}

      <Field label="Your name" name="reporter_name" required />
      <Field label="Phone or email (optional)" name="reporter_contact" />

      <div>
        <label htmlFor="site_id" className="block text-sm font-medium text-ink-950">
          Service location
        </label>
        <select id="site_id" name="site_id" required className="field mt-1.5">
          <option value="">Select a location</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <Field label="Location or landmark (optional)" name="location_text" />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-950">
          Description (optional)
        </label>
        <textarea id="description" name="description" rows={4} className="field mt-1.5 h-auto py-3" />
      </div>

      <button type="submit" disabled={submitting} className="btn-accent w-full disabled:opacity-60">
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
      <input id={name} name={name} required={required} className="field mt-1.5" />
    </div>
  );
}
