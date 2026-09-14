'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AgentShell({ children, fullName }: { children: React.ReactNode; fullName: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/track/agent');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper-50">
      <header className="border-b border-ink-950/10 bg-paper-50">
        <div className="container-page flex h-16 items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-ink-950">SciFi Networks</p>
            <p className="text-xs text-ink-800/60">Agent · {fullName}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/track/agent/report-issue" className="text-sm font-medium text-signal-500 hover:text-signal-600">
              Report Issue
            </Link>
            <button onClick={handleLogout} className="text-sm text-ink-800/70 hover:text-ink-950">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="container-page py-10">{children}</main>
    </div>
  );
}
