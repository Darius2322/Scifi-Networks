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
      <main className="container-page section-py max-w-2xl">
        <p className="eyebrow">Support</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink-950">Frequently Asked Questions</h1>

        {Object.keys(byCategory).length === 0 ? (
          <p className="mt-8 text-ink-700">No FAQs published yet.</p>
        ) : (
          <div className="mt-10 space-y-10">
            {Object.entries(byCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="font-display text-xl font-bold text-ink-950">{category}</h2>
                <div className="mt-4 card divide-y divide-paper-200 px-5">
                  {items.map((faq) => (
                    <details key={faq.id} className="group py-4">
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium text-ink-950">
                        {faq.question}
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          className="shrink-0 text-ink-700 transition-transform group-open:rotate-45"
                        >
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </summary>
                      <p className="mt-3 text-sm text-ink-700 leading-relaxed">{faq.answer}</p>
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
