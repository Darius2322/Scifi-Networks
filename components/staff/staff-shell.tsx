'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/staff/dashboard', label: 'Dashboard' },
  { href: '/staff/customers', label: 'Customers' },
  { href: '/staff/tickets', label: 'Tickets' },
  { href: '/staff/inventory', label: 'Inventory' },
];

export function StaffShell({
  children,
  fullName,
  role,
}: {
  children: React.ReactNode;
  fullName: string;
  role: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/staff/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper-50">
      <header className="border-b border-ink-950/10 bg-ink-950 text-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <p className="font-display text-lg font-semibold">SciFi Networks</p>
            <nav className="hidden sm:flex items-center gap-6 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? 'text-signal-400 font-medium' : 'text-paper-200/70 hover:text-white'}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-paper-200/70">
              {fullName} · <span className="capitalize">{role.replace('_', ' ')}</span>
            </span>
            <button onClick={handleLogout} className="text-paper-200/70 hover:text-white">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
