import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActiveSites, getActivePackages } from '@/lib/data/public';
import { GetConnectedForm } from '@/components/marketing/get-connected-form';

export const metadata: Metadata = {
  title: 'Get Connected',
  description: 'Request Internet installation from SciFi Networks. Get a ticket number instantly and track your request online.',
};

export default async function GetConnectedPage() {
  const [sites, packages] = await Promise.all([getActiveSites(), getActivePackages()]);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Get Connected</h1>
        <p className="mt-2 text-ink-800/80">
          Tell us where you are and what you need. We'll generate a ticket number you can use
          to track your installation from request to activation.
        </p>

        <div className="mt-10">
          <Suspense fallback={null}>
            <GetConnectedForm sites={sites} packages={packages} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
