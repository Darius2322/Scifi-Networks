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
        {/* HERO */}
        <section className="border-b border-paper-200">
          <div className="container-page grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 py-14 lg:py-24 items-center">
            <div>
              <p className="eyebrow">SciFi Networks</p>
              <h1 className="mt-4 font-display text-[40px] sm:text-[52px] lg:text-[64px] font-bold leading-[1.05] text-ink-950">
                Reliable Internet.
                <br />
                Built Around You.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-ink-800 max-w-prose leading-relaxed">
                Fast, dependable internet for homes and businesses across your area — straightforward
                pricing, real local support, and installation that shows up when it says it will.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/get-connected" className="btn-accent">
                  Get Connected
                </Link>
                <Link href="/packages" className="btn-secondary">
                  View Packages
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-2xl bg-paper-200">
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

        {/* COVERAGE */}
        <section id="coverage" className="border-b border-paper-200 bg-paper-100 scroll-mt-20">
          <div className="container-page section-py">
            <p className="eyebrow">Coverage</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink-950">Is SciFi available where you live?</h2>
            <p className="mt-2 text-ink-700 max-w-prose">
              We currently serve the following areas, with installations, support, and local agents on the ground.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.length > 0 ? (
                sites.map((site) => (
                  <div key={site.id} className="card card-hover p-5">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-status-good" aria-hidden="true" />
                      <p className="font-semibold text-ink-950">{site.name}</p>
                    </div>
                    <p className="mt-2 text-sm text-ink-700">
                      Installations, support, and agents serving {site.name} and surrounding areas.
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-700">Service locations will appear here once configured.</p>
              )}
            </div>
          </div>
        </section>

        {/* PACKAGES PREVIEW */}
        {packages.length > 0 && (
          <section className="border-b border-paper-200">
            <div className="container-page section-py">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Packages</p>
                  <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink-950">Straightforward pricing</h2>
                </div>
                <Link href="/packages" className="btn-ghost hidden sm:inline-flex whitespace-nowrap">
                  See all packages →
                </Link>
              </div>

              <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {packages.slice(0, 4).map((pkg, i) => {
                  // Presentational heuristic only: the second tier is highlighted
                  // as the commonly-recommended option. No business data implies
                  // this — swap for a real `is_recommended` flag if one is added.
                  const recommended = i === 1;
                  return (
                    <div
                      key={pkg.id}
                      className={`card card-hover flex flex-col p-6 ${recommended ? 'border-signal-500/50 ring-1 ring-signal-500/20' : ''}`}
                    >
                      {recommended && (
                        <span className="badge bg-signal-500/10 text-signal-500 self-start mb-3">Most Popular</span>
                      )}
                      <p className="font-semibold text-ink-950">{pkg.name}</p>
                      <p className="mt-1 text-sm text-ink-700">{pkg.speed_mbps} Mbps</p>
                      <p className="mt-5 font-display text-3xl font-bold text-ink-950">
                        KES {Number(pkg.price_kes).toLocaleString()}
                        <span className="text-sm font-medium text-ink-700"> /mo</span>
                      </p>
                      <Link href="/get-connected" className="btn-secondary mt-6 w-full">
                        Get Connected
                      </Link>
                    </div>
                  );
                })}
              </div>

              <Link href="/packages" className="btn-ghost mt-6 inline-flex sm:hidden">
                See all packages →
              </Link>
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section className="border-b border-paper-200 bg-paper-100">
          <div className="container-page section-py">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink-950">From request to connected</h2>
            <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              <Step n={1} title="Choose your package" body="Compare speeds and pricing for your area." />
              <Step n={2} title="Submit your request" body="We generate a ticket number the moment you apply." />
              <Step n={3} title="Track your installation" body="Follow your status from request to install." />
              <Step n={4} title="Get connected" body="Your technician arrives and you're online." />
            </ol>
          </div>
        </section>

        {/* AGENT PROGRAM CALLOUT */}
        <section id="agents" className="border-b border-paper-200 scroll-mt-20">
          <div className="container-page section-py">
            <div className="card p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8 justify-between">
                <div className="max-w-lg">
                  <p className="eyebrow">Agent Program</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-ink-950">Become a SciFi Networks agent</h2>
                  <p className="mt-2 text-ink-700">
                    Help keep your neighbourhood connected — look after local equipment, report issues, and support
                    customers nearby.
                  </p>
                  <Link href="/contact" className="btn-primary mt-6">
                    Contact a site office
                  </Link>
                </div>
                <ol className="grid grid-cols-2 gap-x-6 gap-y-5 sm:min-w-[320px]">
                  <AgentStep n={1} label="Look after local equipment" />
                  <AgentStep n={2} label="Report network issues" />
                  <AgentStep n={3} label="Help customers" />
                  <AgentStep n={4} label="Earn free internet vouchers" />
                </ol>
              </div>
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
    <li className="relative pl-0">
      <span className="font-display text-4xl font-bold text-signal-500/25">{String(n).padStart(2, '0')}</span>
      <p className="mt-3 font-semibold text-ink-950">{title}</p>
      <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{body}</p>
    </li>
  );
}

function AgentStep({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal-500/10 text-[11px] font-semibold text-signal-500">
        {n}
      </span>
      <span className="text-sm text-ink-800 leading-snug">{label}</span>
    </li>
  );
}
