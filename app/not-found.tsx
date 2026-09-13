import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-24 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink-950">
          We couldn't find that page.
        </h1>
        <p className="mt-3 text-ink-700 max-w-md mx-auto">
          The page you're looking for may have moved or no longer exists. Here are a few places to go instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-accent">
            Go home
          </Link>
          <Link href="/track" className="btn-secondary">
            Track my request
          </Link>
          <Link href="/contact" className="btn-ghost">
            Contact support
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
