import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { TrackLoginForm } from '@/components/track/track-login-form';
import { getTrackSession } from '@/lib/auth/track-session';

export const metadata: Metadata = {
  title: 'Track My Request',
  description: 'Enter your ticket number and phone or email to track your SciFi Networks installation request.',
};

export default async function TrackEntryPage() {
  const session = await getTrackSession();
  if (session) redirect('/track/dashboard');

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14 max-w-md">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Track My Request</h1>
        <p className="mt-2 text-ink-800/80">
          Enter your ticket number along with the phone number or email you registered.
        </p>
        <div className="mt-8">
          <TrackLoginForm />
        </div>
        <p className="mt-6 text-sm text-ink-800/60">
          Registered as an agent? <a href="/track/agent" className="text-signal-500 hover:text-signal-600">Sign in here</a>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
