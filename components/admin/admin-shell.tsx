'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/wp-admin', label: 'Overview' },
  { href: '/wp-admin/sites', label: 'Sites' },
  { href: '/wp-admin/customers', label: 'Customers' },
  { href: '/wp-admin/agents', label: 'Agents' },
  { href: '/wp-admin/staff', label: 'Staff' },
  { href: '/wp-admin/packages', label: 'Packages' },
  { href: '/wp-admin/tickets', label: 'Tickets' },
  { href: '/wp-admin/inventory', label: 'Inventory' },
  { href: '/wp-admin/vouchers', label: 'Vouchers' },
  { href: '/wp-admin/reports', label: 'Reports' },
  { href: '/wp-admin/audit-logs', label: 'Audit Logs' },
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
    <div className="min-h-screen bg-paper-50 lg:flex">
      <aside className="lg:w-60 shrink-0 bg-ink-950 text-white lg:min-h-screen">
        <div className="p-5 border-b border-white/10">
          <p className="font-display text-lg font-semibold">SciFi Networks</p>
          <p className="text-xs text-paper-200/50 mt-0.5">Owner Console</p>
        </div>
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3 py-2 text-sm rounded-sm ${
                pathname === item.href
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-paper-200/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="border-b border-ink-950/10 bg-paper-50">
          <div className="flex h-16 items-center justify-end gap-4 px-6 text-sm">
            <span className="text-ink-800/70">{fullName}</span>
            <button onClick={handleLogout} className="text-ink-800/70 hover:text-ink-950">
              Log out
            </button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
