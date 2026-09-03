import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActiveSites } from '@/lib/data/public';
import { PublicReportIssueForm } from '@/components/marketing/public-report-issue-form';

export const metadata: Metadata = {
  title: 'Report an Issue',
  description: 'Report a network problem to SciFi Networks and get a ticket number instantly — no account or phone number required.',
};

export default async function ReportIssuePage() {
  const sites = await getActiveSites();

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14 max-w-xl">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Report an Issue</h1>
        <p className="mt-2 text-ink-800/80">
          Spotted a problem with the network? Let us know — you'll get a ticket number to track
          it, and you don't need an account or phone number to report it.
        </p>

        <div className="mt-10">
          <Suspense fallback={null}>
            <PublicReportIssueForm sites={sites} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
