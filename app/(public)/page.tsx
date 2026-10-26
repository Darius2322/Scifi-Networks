import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { StatusStrip } from '@/components/marketing/status-strip';
import { ReviewsSection } from '@/components/marketing/reviews-section';
import { getActiveSites, getActivePackages, getPublishedReviews, getSiteSettings } from '@/lib/data/public';

export default async function HomePage() {
  const [sites, packages, reviews, settings] = await Promise.all([
    getActiveSites(),
    getActivePackages(),
    getPublishedReviews(),
    getSiteSettings(),
  ]);

  // Only show contact buttons that are actually configured — no placeholder numbers.
  const contact = settings.company_contact ?? {};
  const phone: string | undefined = contact.phone || undefined;
  const whatsapp: string | undefined = contact.whatsapp || contact.phone || undefined;

  return (
    <>
      <SiteHeader />
      <StatusStrip sites={sites} />

      <main>
        {/* PORTAL — two-column layout following the Wi-Fi Portal design */}
        <section className="border-b border-paper-200">
          <div className="container-page py-10 sm:py-14">
            <p className="eyebrow">SciFi Networks</p>
            <h1 className="mt-2 font-display text-[30px] sm:text-4xl lg:text-5xl font-bold leading-tight text-ink-950">
              Reliable Internet. Built Around You.
            </h1>
            <p className="mt-3 max-w-prose text-ink-700">
              Fast, dependable internet for homes and businesses — straightforward pricing and real local support.
            </p>

            <div className="mt-8 grid lg:grid-cols-2 gap-5 lg:gap-6 items-start">
              {/* GET CONNECTED */}
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <WifiIcon className="h-9 w-9 text-signal-500" />
                  <h2 className="font-display text-2xl font-bold text-ink-950">Get Connected</h2>
                </div>
                <p className="mt-3 text-ink-700 leading-relaxed">
                  Request an installation and you'll get a ticket number to follow your request from start to finish.
                </p>
                <Link href="/get-connected" className="btn-primary mt-6 w-full">
                  <WifiIcon className="h-5 w-5" />
                  Get Connected
                </Link>
                <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-700" aria-hidden="true">
                  <span className="h-px flex-1 bg-paper-200" />
                  or
                  <span className="h-px flex-1 bg-paper-200" />
                </div>
                <div className="flex items-start gap-3 rounded-md bg-signal-500/10 p-4 text-sm text-ink-800">
                  <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-signal-500" />
                  <p>
                    Already requested?{' '}
                    <Link href="/track" className="font-semibold text-signal-600 hover:text-ink-950">
                      Track your request
                    </Link>{' '}
                    with your ticket number.
                  </p>
                </div>
              </div>

              {/* PACKAGES */}
              <div className="card overflow-hidden">
                <div className="p-6 sm:p-8 pb-4">
                  <div className="flex items-center gap-3">
                    <CartIcon className="h-8 w-8 text-signal-500" />
                    <h2 className="font-display text-2xl font-bold text-ink-950">Choose a Package</h2>
                  </div>
                  <p className="mt-2 text-sm text-ink-700">Pick a package that suits your needs.</p>
                </div>
                {packages.length > 0 ? (
                  <ul className="divide-y divide-paper-200 border-t border-paper-200">
                    {packages.slice(0, 4).map((pkg) => (
                      <li key={pkg.id} className="flex items-center gap-4 px-6 sm:px-8 py-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal-500 text-white">
                          <WifiIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink-950 truncate">{pkg.name}</p>
                          <p className="text-sm text-ink-700">
                            {pkg.speed_mbps} Mbps • {pkg.duration_days} days
                          </p>
                        </div>
                        <p className="hidden sm:block font-semibold text-ink-950 whitespace-nowrap">
                          KSh {Number(pkg.price_kes).toLocaleString()}
                        </p>
                        <Link
                          href={`/get-connected?package=${pkg.id}`}
                          className="btn-primary !h-9 !px-4"
                          aria-label={`Get ${pkg.name} for KSh ${Number(pkg.price_kes).toLocaleString()}`}
                        >
                          <span className="sm:hidden mr-1">KSh {Number(pkg.price_kes).toLocaleString()}</span>
                          Get
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="border-t border-paper-200 p-6 text-sm text-ink-700">Packages will appear here soon.</p>
                )}
                <div className="border-t border-paper-200 px-6 sm:px-8 py-4">
                  <Link href="/packages" className="text-sm font-semibold text-signal-600 hover:text-ink-950">
                    Compare all packages →
                  </Link>
                </div>
              </div>

              {/* COVERAGE */}
              <div id="coverage" className="card p-6 sm:p-8 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <PinIcon className="h-7 w-7 text-signal-500" />
                  <h2 className="font-display text-xl font-bold text-ink-950">Where we operate</h2>
                </div>
                <p className="mt-2 text-sm text-ink-700">Is SciFi available where you live?</p>
                {sites.length > 0 ? (
                  <ul className="mt-4 divide-y divide-paper-200 rounded-md border border-paper-200">
                    {sites.map((site) => (
                      <li key={site.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="font-medium text-ink-950">{site.name}</span>
                        <span className="flex items-center gap-2 text-ink-700">
                          <span
                            className={`h-2 w-2 rounded-full ${site.network_status === 'operational' ? 'bg-status-good' : 'bg-status-warn'}`}
                            aria-hidden="true"
                          />
                          {site.network_status === 'operational' ? 'Operational' : 'Service notice'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-700">Service locations will appear here once configured.</p>
                )}
              </div>

              {/* NEED HELP */}
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <HeadsetIcon className="h-7 w-7 text-signal-500" />
                  <h2 className="font-display text-xl font-bold text-ink-950">Need Help?</h2>
                </div>
                <p className="mt-2 text-sm text-ink-700">Having trouble connecting? Our team is here to help.</p>
                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-success"
                    >
                      Chat on WhatsApp
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`} className="btn-secondary">
                      Call Support
                    </a>
                  )}
                  {!whatsapp && !phone && (
                    <Link href="/contact" className="btn-secondary sm:col-span-2">
                      Contact us
                    </Link>
                  )}
                </div>
                <p className="mt-4 text-sm text-ink-700">
                  Something not working?{' '}
                  <Link href="/report-issue" className="font-semibold text-signal-600 hover:text-ink-950">
                    Report an issue
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

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

        {/* AGENT PROGRAM */}
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
    <li>
      <span className="font-display text-4xl font-bold text-signal-500/25">{String(n).padStart(2, '0')}</span>
      <p className="mt-3 font-semibold text-ink-950">{title}</p>
      <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{body}</p>
    </li>
  );
}

function AgentStep({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal-500/10 text-[11px] font-semibold text-signal-600">
        {n}
      </span>
      <span className="text-sm text-ink-800 leading-snug">{label}</span>
    </li>
  );
}

type IconProps = { className?: string };

function WifiIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 8.8a15 15 0 0 1 20 0" />
      <path d="M5.5 12.4a10 10 0 0 1 13 0" />
      <path d="M9 16a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </svg>
  );
}
function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
function CartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2" />
      <circle cx="9" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}
function PinIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function HeadsetIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  );
}
