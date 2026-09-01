'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AgentLoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/agents/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (json.mustChangePassword) {
        router.push('/staff/change-password');
        return;
      }

      router.push('/track/agent/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-3 text-sm text-status-bad">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-ink-950">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          autoComplete="username"
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink-950">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        />
        <p className="mt-1.5 text-xs text-ink-800/50">
          First time signing in? Your username is what SciFi Networks gave you, and your
          password is your registered phone number. You'll be asked to change it right away.
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-5 py-3 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
