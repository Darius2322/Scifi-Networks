'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
    items: [{ href: '/wp-admin/audit-logs', label: 'Audit Logs' }],
  },
];

export function AdminShell({ children, fullName }: { children: React.ReactNode; fullName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/wp-admin/login');
    router.refresh();
  }

  return (
    // Independent-scroll layout (sidebar nav scrolls separately from page
    // content) only applies at desktop width — on mobile this falls back to
    // normal stacked document flow so the sidebar can't push content off-screen.
    <div className="lg:h-screen lg:overflow-hidden lg:flex bg-paper-50 min-h-screen">
      <aside className="lg:w-64 shrink-0 bg-ink-950 text-white flex flex-col lg:h-full">
        <div className="p-5 border-b border-white/10 shrink-0">
          <p className="font-display text-lg font-semibold">SciFi Networks</p>
          <p className="text-xs text-white/50 mt-0.5">Owner Console</p>
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
      </aside>

      <div className="flex-1 lg:h-full lg:overflow-y-auto">
        <header className="border-b border-ink-950/10 bg-paper-100 lg:sticky lg:top-0 z-10">
          <div className="flex h-14 items-center justify-end gap-4 px-6 text-sm">
            <span className="text-ink-800/70">{fullName}</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
