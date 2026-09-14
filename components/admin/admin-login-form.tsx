'use client';

import { useState } from 'react';
import { PasswordField } from '@/components/ui/password-field';
import { useRouter, useSearchParams } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (json.mfaRequired) {
        setMfaFactorId(json.factorId);
        return;
      }

      if (json.mustChangePassword) {
        router.push('/staff/change-password');
        return;
      }

      const next = searchParams.get('next') || '/wp-admin';
      router.push(next);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: mfaFactorId, code: formData.get('code') }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'That code was incorrect.');
        return;
      }
      const next = searchParams.get('next') || '/wp-admin';
      router.push(next);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (mfaFactorId) {
    return (
      <form onSubmit={handleMfaSubmit} className="space-y-5" noValidate>
        <p className="text-sm text-ink-800/80">Enter the 6-digit code from your authenticator app.</p>
        {error && (
          <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-3 text-sm text-status-bad">
            {error}
          </p>
        )}
        <input
          name="code"
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoFocus
          placeholder="123456"
          className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-center text-lg tracking-[0.3em] focus:border-signal-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-5 py-3 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Verifying…' : 'Verify and sign in'}
        </button>
      </form>
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
        <label htmlFor="identifier" className="block text-sm font-medium text-ink-950">
          Username or email
        </label>
        <input
          id="identifier"
          name="identifier"
          required
          autoComplete="username"
          className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2.5 text-sm focus:border-signal-500"
        />
      </div>

      <PasswordField id="password" name="password" label="Password" autoComplete="current-password" />

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
