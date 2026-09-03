'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Site = { id: string; name: string };
type Package = { id: string; name: string; speed_mbps: number; price_kes: number };

export function GetConnectedForm({ sites, packages }: { sites: Site[]; packages: Package[] }) {
  const searchParams = useSearchParams();
  const preselectedPackage = searchParams.get('package') ?? '';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "We couldn't complete that request. Please try again.");
        return;
      }
      setTicketNumber(json.ticket_number);
    } catch {
      setError("We couldn't complete that request. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="animate-success border border-status-good/30 bg-status-good/5 p-6">
        <p className="text-sm font-medium text-status-good">Request submitted</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink-950">{ticketNumber}</p>
        <p className="mt-3 text-sm text-ink-800/80 max-w-prose">
          Keep this ticket number. You'll use it together with your phone number or email to
          access and track your request at any time.
        </p>
        <Link
          href="/track"
          className="mt-5 inline-flex items-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors"
        >
          Track my request
        </Link>
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

      <Field label="Full name" name="full_name" required autoComplete="name" />
      <Field label="Phone number" name="phone" required placeholder="07XXXXXXXX" autoComplete="tel" />
      <Field label="Email (optional)" name="email" type="email" autoComplete="email" />

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

      <Field label="Estate / area" name="estate_area" required />
      <Field label="Specific address or landmark (optional)" name="address_details" />

      <div>
        <label htmlFor="package_id" className="block text-sm font-medium text-ink-950">
          Preferred package (optional)
        </label>
        <select
          id="package_id"
          name="package_id"
          defaultValue={preselectedPackage}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        >
          <option value="">No preference</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.speed_mbps} Mbps — KES {Number(p.price_kes).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <Field label="Preferred installation date/time (optional)" name="preferred_datetime" type="datetime-local" />

      <div>
        <label htmlFor="additional_notes" className="block text-sm font-medium text-ink-950">
          Additional notes (optional)
        </label>
        <textarea
          id="additional_notes"
          name="additional_notes"
          rows={3}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-sm bg-signal-500 px-5 py-3 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-950">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
      />
    </div>
  );
}
