import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { StatusStrip } from '@/components/marketing/status-strip';
import { ReviewsSection } from '@/components/marketing/reviews-section';
import { getActiveSites, getActivePackages, getPublishedReviews } from '@/lib/data/public';

export default async function HomePage() {
  const [sites, packages, reviews] = await Promise.all([getActiveSites(), getActivePackages(), getPublishedReviews()]);

  return (
    <>
      <SiteHeader />
      <StatusStrip sites={sites} />

      <main>
        {/* HERO — asymmetric split, no gradient. Copy leads, a real coverage
            list stands in for decoration since it's information a visitor
            actually needs. */}
        <section className="border-b border-ink-950/10">
          <div className="container-page grid lg:grid-cols-[1.1fr_0.9fr] gap-12 py-16 lg:py-24 items-center">
            <div>
              <p className="text-sm font-medium text-signal-500">A network that everyone is using but you are not.</p>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] text-ink-950">
                Reliable Internet. Built Around You.
              </h1>
              <p className="mt-5 text-lg text-ink-800 max-w-prose">
                A network that everyone is using but you are not — yet. We connect homes and
                businesses across your area with straightforward pricing, real local support,
                and installation that actually shows up on time.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/get-connected"
                  className="inline-flex items-center rounded-sm bg-signal-500 px-5 py-3 text-sm font-medium text-white hover:bg-signal-600 transition-colors"
                >
                  Get Connected
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center rounded-sm border border-ink-950/15 px-5 py-3 text-sm font-medium text-ink-950 hover:border-ink-950/30 transition-colors"
                >
                  Track My Request
                </Link>
                <Link
                  href="/report-issue"
                  className="inline-flex items-center px-5 py-3 text-sm font-medium text-status-warn hover:text-status-bad transition-colors"
                >
                  Report an Issue
                </Link>
                <Link
                  href="/packages"
                  className="inline-flex items-center px-5 py-3 text-sm font-medium text-ink-800 hover:text-signal-500 transition-colors"
                >
                  View Packages →
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-sm bg-ink-100">
              <Image
                src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop"
                alt="Fiber network technician working on connectivity infrastructure"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* COVERAGE — real content, doubles as visual structure */}
        <section className="border-b border-ink-950/10 bg-paper-100">
          <div className="container-page py-14">
            <h2 className="font-display text-2xl font-semibold text-ink-950">Where we operate</h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {sites.length > 0
                ? sites.map((site) => (
                    <div key={site.id} className="border border-ink-950/10 bg-paper-50 p-5">
                      <p className="font-medium text-ink-950">{site.name}</p>
                      <p className="mt-1 text-sm text-ink-800/70">
                        Installations, support, and agents serving {site.name} and surrounding areas.
                      </p>
                    </div>
                  ))
                : (
                  <p className="text-sm text-ink-800/70">Service locations will appear here once configured.</p>
                )}
            </div>
          </div>
        </section>

        {/* PACKAGES PREVIEW */}
        {packages.length > 0 && (
          <section className="border-b border-ink-950/10">
            <div className="container-page py-14">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-semibold text-ink-950">Packages</h2>
                <Link href="/packages" className="text-sm font-medium text-signal-500 hover:text-signal-600">
                  See all packages →
                </Link>
              </div>
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.slice(0, 4).map((pkg) => (
                  <div key={pkg.id} className="border border-ink-950/10 p-5 flex flex-col">
                    <p className="font-medium text-ink-950">{pkg.name}</p>
                    <p className="mt-1 text-sm text-ink-800/70">{pkg.speed_mbps} Mbps</p>
                    <p className="mt-4 font-display text-2xl font-semibold text-ink-950">
                      KES {Number(pkg.price_kes).toLocaleString()}
                      <span className="text-sm font-body font-normal text-ink-800/60"> /mo</span>
                    </p>
                    <Link
                      href="/get-connected"
                      className="mt-5 text-sm font-medium text-signal-500 hover:text-signal-600"
                    >
                      Get Connected →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* HOW IT WORKS — genuinely sequential, so numbering is earned here */}
        <section className="border-b border-ink-950/10 bg-paper-100">
          <div className="container-page py-14">
            <h2 className="font-display text-2xl font-semibold text-ink-950">How it works</h2>
            <ol className="mt-6 grid sm:grid-cols-3 gap-6">
              <Step n={1} title="Choose a package" body="Compare speeds and pricing for your area, then submit a request." />
              <Step n={2} title="Get your ticket" body="We generate a ticket number the moment your request is submitted." />
              <Step n={3} title="Track and connect" body="Follow your installation status from request to active connection." />
            </ol>
          </div>
        </section>

        {/* AGENT PROGRAM CALLOUT */}
        <section>
          <div className="container-page py-14">
            <div className="border border-ink-950/10 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-950">Become a SciFi Networks agent</h2>
                <p className="mt-2 text-ink-800/80 max-w-prose">
                  Agents help look after local equipment and report issues in their area, and receive
                  free Internet vouchers in return. Ask your local site office to learn more.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-sm border border-ink-950/15 px-5 py-3 text-sm font-medium text-ink-950 hover:border-ink-950/30 transition-colors whitespace-nowrap"
              >
                Contact a site office
              </Link>
            </div>
          </div>
        </section>

        <ReviewsSection reviews={reviews} />
      </main>

      <SiteFooter />
    </>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="border-t border-ink-950/15 pt-4">
      <span className="text-sm text-signal-500 font-medium">Step {n}</span>
      <p className="mt-1 font-medium text-ink-950">{title}</p>
      <p className="mt-1 text-sm text-ink-800/70">{body}</p>
    </li>
  );
}
