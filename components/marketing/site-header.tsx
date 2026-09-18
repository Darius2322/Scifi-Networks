'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const PRIMARY_NAV = [
  { href: '/', label: 'Home' },
  { href: '/packages', label: 'Packages' },
  { href: '/#coverage', label: 'Coverage' },
  { href: '/about', label: 'About' },
];

const SUPPORT_LINKS = [
  { href: '/track', label: 'Track Request' },
  { href: '/report-issue', label: 'Report an Issue' },
  { href: '/status', label: 'Network Status' },
  { href: '/faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-paper-50/90 backdrop-blur transition-shadow duration-200 ${
        scrolled ? 'border-b border-paper-200 shadow-[0_1px_0_0_rgb(0_0_0/0.02)]' : 'border-b border-transparent'
      }`}
    >
      <div className="container-page flex h-[68px] sm:h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink-950">
          <LogoMark />
          SciFi Networks
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-800">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-signal-500 transition-colors">
              {item.label}
            </Link>
          ))}
          <SupportMenu />
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/get-connected" className="btn-primary">
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
      <circle cx="13" cy="20" r="1.8" className="fill-signal-500" />
      <path d="M8 15.5C10.5 13 15.5 13 18 15.5" className="stroke-signal-500" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 11.5C9.5 6.8 16.5 6.8 21.5 11.5" className="stroke-ink-950" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SupportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 hover:text-signal-500 transition-colors"
      >
        Support
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 card shadow-[0_12px_32px_-12px_rgb(0_0_0/0.18)] py-2 animate-fade-up">
          {SUPPORT_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-800 hover:bg-paper-50 hover:text-signal-500 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Prevent background scroll while the menu is open.
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Move focus into the menu once it's open, for keyboard/screen-reader users.
      firstLinkRef.current?.focus();
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Escape closes the menu.
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="stroke-ink-950">
            <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="stroke-ink-950">
            <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        // Full-viewport overlay. Deliberately NOT nested inside any element
        // that applies backdrop-filter/filter/transform — those create a new
        // CSS containing block for `fixed` descendants, which is exactly
        // what broke this menu previously (it rendered, but collapsed to
        // the header's own 64px height instead of the full screen).
        //
        // The close button lives INSIDE this panel, not just the toggle
        // button in the header behind it — that header button visually sits
        // underneath this overlay once open, so relying on it alone as the
        // only way to close made the close affordance easy to miss.
        <div className="fixed inset-0 z-50 bg-black/40 animate-success" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 top-0 bg-paper-100 border-b border-paper-200 max-h-screen overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 h-[68px] border-b border-paper-200">
              <span className="font-display text-base font-semibold text-ink-950">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 text-ink-950 hover:text-signal-500"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-5">
              {PRIMARY_NAV.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={i === 0 ? firstLinkRef : undefined}
                  onClick={() => setOpen(false)}
                  className="py-3.5 text-base font-medium text-ink-950 border-b border-paper-200"
                >
                  {item.label}
                </Link>
              ))}

              <p className="mt-5 mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">Support</p>
              {SUPPORT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-[15px] text-ink-800 border-b border-paper-200"
                >
                  {item.label}
                </Link>
              ))}

              <Link href="/get-connected" onClick={() => setOpen(false)} className="btn-primary mt-6 w-full">
                Get Connected
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
