import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getSiteSettings } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  robots: { index: false, follow: true },
};

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const content: string = settings.terms_and_conditions || '';

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Terms & Conditions</h1>
        <div className="mt-8 space-y-4 text-ink-800/90 whitespace-pre-line">
          {content || 'Terms and conditions have not been published yet.'}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
