'use client';

import { useState } from 'react';

export function ShareButton({ title = 'SciFi Networks', className = '' }: { title?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no error needed
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-ink-800 hover:text-signal-500 transition-colors ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
