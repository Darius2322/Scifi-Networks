'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/get-connected',
    label: 'Connect',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 8a6 6 0 0112 0M9 11a3 3 0 016 0" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/track',
    label: 'Track',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/contact',
    label: 'Support',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v10H8l-4 4V6z" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-paper-100 border-t border-paper-200 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${active ? 'text-signal-500' : 'text-ink-700'}`}
          >
            {item.icon(active)}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
