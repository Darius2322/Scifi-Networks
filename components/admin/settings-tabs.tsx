'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/wp-admin/settings', label: 'Branding & Contact' },
  { href: '/wp-admin/settings/security', label: 'Security' },
  { href: '/wp-admin/staff', label: 'Users & Roles' },
  { href: '/wp-admin/sites', label: 'Locations' },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mt-4 flex flex-wrap gap-1 border-b border-ink-950/10">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-3 py-2 text-sm ${
            pathname === tab.href ? 'border-b-2 border-signal-500 text-ink-950 font-medium' : 'text-ink-800/60 hover:text-ink-950'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
