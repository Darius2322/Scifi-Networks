'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV = [
  { href: '/packages', label: 'Packages' },
  { href: '/hotspot', label: 'Hotspot' },
  { href: '/get-connected', label: 'Get Connected' },
  { href: '/track', label: 'Track Request' },
  { href: '/status', label: 'Network Status' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-ink-950/10 bg-paper-50/95 backdrop-blur supports-[backdrop-filter]:bg-paper-50/80 sticky top-0 z-40">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink-950">
          <LogoMark />
          SciFi Networks
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-800">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-signal-500 transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/get-connected"
            className="inline-flex items-center rounded-sm bg-signal-500 px-4 py-2 text-sm font-medium text-white hover:bg-signal-600 transition-colors"
          >
            Get Connected
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="20" r="1.8" fill="#1E6FE0" />
      <path d="M8 15.5C10.5 13 15.5 13 18 15.5" stroke="#1E6FE0" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 11.5C9.5 6.8 16.5 6.8 21.5 11.5" stroke="#0B1220" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);

  // Prevent background scroll while the menu is open (spec section 50).
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Close on route change / escape for good measure.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="p-2 -mr-2"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="#0B1220" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#0B1220" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 bg-paper-50 border-t border-ink-950/10 p-5 overflow-y-auto z-50">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-ink-950 border-b border-ink-950/5"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/get-connected"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-3 text-sm font-medium text-white"
            >
              Get Connected
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
