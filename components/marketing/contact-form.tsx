'use client';

import { useState } from 'react';

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "We couldn't send that. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <p className="font-medium text-status-good">Message sent</p>
        <p className="mt-2 text-sm text-ink-700">We'll get back to you as soon as we can.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-status-bad/30 bg-status-bad/5 p-3 text-sm text-status-bad">
          {error}
        </p>
      )}

      <Field label="Full name" name="name" required autoComplete="name" />
      <Field label="Email (optional)" name="email" type="email" autoComplete="email" />
      <Field label="Phone (optional)" name="phone" autoComplete="tel" />
      <Field label="Subject (optional)" name="subject" />

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink-950">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="field mt-1.5"
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-accent w-full disabled:opacity-60">
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

function Field({ label, name, required, type = 'text', autoComplete }: any) {
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
        className="field mt-1.5"
      />
    </div>
  );
}
