'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failures shouldn't break the page — offline support
        // is a progressive enhancement, not a requirement.
      });
    }
  }, []);

  return null;
}
