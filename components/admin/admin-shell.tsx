'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GlobalSearch } from './global-search';

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [{ href: '/wp-admin', label: 'Overview' }],
  },
  {
    label: 'Operations',
    items: [
      { href: '/wp-admin/customers', label: 'Customers' },
      { href: '/wp-admin/installations', label: 'Installations' },
      { href: '/wp-admin/tickets', label: 'Tickets' },
      { href: '/wp-admin/inventory', label: 'Inventory' },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/wp-admin/sites', label: 'Sites' },
      { href: '/wp-admin/packages', label: 'Packages' },
      { href: '/wp-admin/vouchers', label: 'Vouchers' },
      { href: '/wp-admin/maintenance', label: 'Maintenance' },
      { href: '/wp-admin/reviews', label: 'Reviews' },
      { href: '/wp-admin/reports', label: 'Reports' },
      { href: '/wp-admin/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/wp-admin/agents', label: 'Agents' },
      { href: '/wp-admin/staff', label: 'Staff' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/wp-admin/settings', label: 'Settings' },
      { href: '/wp-admin/audit-logs', label: 'Audit Logs' },
    ],
  },
];

export function AdminShell({ children, fullName }: { children: React.ReactNode; fullName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/wp-admin/login');
    router.refresh();
  }

  const SidebarNav = (
    <>
      <div className="p-5 border-b border-white/10 shrink-0 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold">SciFi Networks</p>
          <p className="text-xs text-white/50 mt-0.5">Owner Console</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/70 hover:text-white" aria-label="Close menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="lg:flex-1 lg:overflow-y-auto p-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">{group.label}</p>
            <div className="mt-1 flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 text-sm rounded-sm ${
                    pathname === item.href
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white">
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="lg:h-screen lg:overflow-hidden lg:flex bg-paper-50 min-h-screen">
      {/* Desktop: permanent sidebar */}
      <aside className="hidden lg:flex lg:w-64 shrink-0 bg-ink-950 text-white flex-col lg:h-full">
        {SidebarNav}
      </aside>

      {/* Mobile: slide-in drawer, never dumped inline above content */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[80vw] bg-ink-950 text-white flex flex-col h-full">{SidebarNav}</div>
          <button
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}

      <div className="flex-1 lg:h-full lg:overflow-y-auto">
        <header className="border-b border-ink-950/10 bg-paper-100 lg:sticky lg:top-0 z-10">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6 text-sm">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1 -ml-1 text-ink-950"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex-1">
              <GlobalSearch />
            </div>
            <span className="text-ink-800/70 hidden sm:inline whitespace-nowrap">{fullName}</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
