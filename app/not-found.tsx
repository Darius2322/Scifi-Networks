import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-24 text-center">
        <p className="text-sm font-medium text-signal-500">404</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-ink-950">
          We couldn't find that page.
        </h1>
        <p className="mt-3 text-ink-800/80 max-w-md mx-auto">
          The page you're looking for may have moved or no longer exists. Here are a few places to go instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-sm bg-signal-500 px-5 py-3 text-sm font-medium text-white hover:bg-signal-600 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/track"
            className="inline-flex items-center rounded-sm border border-ink-950/15 px-5 py-3 text-sm font-medium text-ink-950 hover:border-ink-950/30 transition-colors"
          >
            Track my request
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-5 py-3 text-sm font-medium text-ink-800 hover:text-signal-500 transition-colors"
          >
            Contact support
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
