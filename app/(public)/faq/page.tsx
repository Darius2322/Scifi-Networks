import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getPublishedFaqs } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about getting connected, packages, payments, and support at SciFi Networks.',
};

export const revalidate = 300;

export default async function FaqPage() {
  const faqs = await getPublishedFaqs();

  const byCategory = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    (acc[faq.category] ??= []).push(faq);
    return acc;
  }, {});

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Frequently Asked Questions</h1>

        {Object.keys(byCategory).length === 0 ? (
          <p className="mt-8 text-ink-800/70">No FAQs published yet.</p>
        ) : (
          <div className="mt-10 space-y-10">
            {Object.entries(byCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="font-display text-xl font-semibold text-ink-950">{category}</h2>
                <div className="mt-4 divide-y divide-ink-950/10 border-t border-ink-950/10">
                  {items.map((faq) => (
                    <details key={faq.id} className="group py-4">
                      <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-ink-950">
                        {faq.question}
                        <span className="text-ink-800/40 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <p className="mt-3 text-sm text-ink-800/80">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
