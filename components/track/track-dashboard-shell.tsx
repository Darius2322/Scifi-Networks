'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function TrackDashboardShell({
  children,
  customerName,
  installationId,
}: {
  children: React.ReactNode;
  customerName?: string;
  installationId: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/track/logout', { method: 'POST' });
    router.push('/track');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper-50">
      <header className="border-b border-paper-200 bg-paper-100">
        <div className="container-page flex h-[68px] items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-ink-950">SciFi Networks</p>
            {customerName && <p className="text-xs text-ink-700">Welcome, {customerName}</p>}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/track/report-issue?installation=${installationId}`}
              className="text-sm font-medium text-signal-600 hover:text-ink-950"
            >
              Report Issue
            </Link>
            <button onClick={handleLogout} className="text-sm text-ink-700 hover:text-ink-950">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="container-page py-10">{children}</main>
    </div>
  );
}
