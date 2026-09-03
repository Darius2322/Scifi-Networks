'use client';

import { useState } from 'react';

export function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(formData.entries()), rating }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "We couldn't submit that. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="animate-success border border-status-good/30 bg-status-good/5 p-5 text-sm text-status-good">
        Thanks for the feedback — your review will appear once reviewed.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-3 text-sm text-status-bad">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-950">
          Your name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-950">Rating</label>
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className={n <= rating ? 'text-signal-500' : 'text-ink-950/20'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-ink-950">
          Your review
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          rows={4}
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-sm bg-signal-500 px-5 py-3 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
