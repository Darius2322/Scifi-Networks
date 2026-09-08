'use client';

import { useState } from 'react';

export function SecuritySettings({ existingFactorId }: { existingFactorId: string | null }) {
  const [factorId, setFactorId] = useState<string | null>(existingFactorId);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function startEnroll() {
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/admin/mfa/enroll', { method: 'POST' });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? 'Could not start 2FA setup.');
      return;
    }
    setFactorId(json.factorId);
    setQrCode(json.qrCode);
    setSecret(json.secret);
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    const res = await fetch('/api/admin/mfa/verify-enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factorId, code: formData.get('code') }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? 'That code was incorrect.');
      return;
    }
    setQrCode(null);
    setSecret(null);
    setSuccess('Two-factor authentication is now enabled on your account.');
  }

  async function handleDisable() {
    if (!factorId || !window.confirm('Disable two-factor authentication?')) return;
    setSubmitting(true);
    await fetch('/api/admin/mfa/unenroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factorId }),
    });
    setSubmitting(false);
    setFactorId(null);
    setSuccess('Two-factor authentication has been disabled.');
  }

  return (
    <div className="border border-ink-950/10 p-5 space-y-4">
      {error && <p className="border border-status-bad/30 bg-status-bad/5 p-2.5 text-xs text-status-bad">{error}</p>}
      {success && <p className="border border-status-good/30 bg-status-good/5 p-2.5 text-xs text-status-good">{success}</p>}

      {factorId && !qrCode && (
        <div>
          <p className="text-sm text-status-good font-medium">Two-factor authentication is enabled.</p>
          <button onClick={handleDisable} disabled={submitting} className="mt-3 text-sm text-status-bad hover:text-status-bad/80">
            Disable 2FA
          </button>
        </div>
      )}

      {!factorId && !qrCode && (
        <div>
          <p className="text-sm text-ink-800/70">Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc).</p>
          <button onClick={startEnroll} disabled={submitting} className="mt-3 bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
            {submitting ? 'Starting…' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {qrCode && (
        <form onSubmit={handleVerify} className="space-y-3">
          <p className="text-sm text-ink-800/80">Scan this code with your authenticator app:</p>
          <div className="border border-ink-950/10 p-3 inline-block" dangerouslySetInnerHTML={{ __html: qrCode }} />
          {secret && <p className="text-xs text-ink-800/50 font-mono break-all">Manual entry key: {secret}</p>}
          <input
            name="code"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="Enter the 6-digit code to confirm"
            className="w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={submitting} className="bg-signal-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
            {submitting ? 'Confirming…' : 'Confirm and enable'}
          </button>
        </form>
      )}
    </div>
  );
}
