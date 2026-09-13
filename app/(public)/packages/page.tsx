import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActivePackages } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'Internet Packages',
  description: 'Compare SciFi Networks Internet packages by speed and price for your area.',
};

export const revalidate = 60;

export default async function PackagesPage() {
  const packages = await getActivePackages();

  // Union of every package's own feature list, in first-seen order — used to
  // build the comparison table below. No features are invented; a package
  // simply gets a check where its own `features` array already includes it.
  const allFeatures: string[] = [];
  for (const pkg of packages) {
    for (const f of pkg.features ?? []) {
      if (!allFeatures.includes(f)) allFeatures.push(f);
    }
  }

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-paper-200 bg-paper-100">
          <div className="container-page section-py">
            <p className="eyebrow">Packages</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink-950">Internet Packages</h1>
            <p className="mt-3 text-ink-700 max-w-prose">
              Pricing and availability are managed by our team and may vary by location. Choose a package below
              to start your installation request.
            </p>
          </div>
        </div>

        <div className="container-page py-14 sm:py-20">
          {packages.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-ink-700">
                No packages are available right now. Please check back shortly, or contact us directly.
              </p>
              <Link href="/contact" className="btn-secondary mt-5 inline-flex">
                Contact us
              </Link>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {packages.map((pkg, i) => {
                  const recommended = i === 1;
                  return (
                    <div
                      key={pkg.id}
                      className={`card card-hover flex flex-col p-6 ${recommended ? 'border-signal-500/50 ring-1 ring-signal-500/20' : ''}`}
                    >
                      {recommended && (
                        <span className="badge bg-signal-500/10 text-signal-500 self-start mb-3">Most Popular</span>
                      )}
                      <p className="font-display text-lg font-semibold text-ink-950">{pkg.name}</p>
                      <p className="mt-1 text-sm text-ink-700">{pkg.speed_mbps} Mbps</p>
                      <p className="mt-5 font-display text-3xl font-bold text-ink-950">
                        KES {Number(pkg.price_kes).toLocaleString()}
                        <span className="text-sm font-medium text-ink-700"> / {pkg.duration_days} days</span>
                      </p>
                      {pkg.description && <p className="mt-3 text-sm text-ink-700 leading-relaxed">{pkg.description}</p>}
                      {pkg.features?.length > 0 && (
                        <ul className="mt-4 space-y-1.5 text-sm text-ink-800">
                          {pkg.features.map((f: string) => (
                            <li key={f} className="flex gap-2">
                              <CheckIcon />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link href={`/get-connected?package=${pkg.id}`} className="btn-accent mt-6">
                        Get Connected
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* COMPARISON TABLE — desktop: full grid. Mobile: stacked, one
                  package per block, so nothing requires horizontal scrolling. */}
              {allFeatures.length > 0 && (
                <div className="mt-16">
                  <h2 className="font-display text-2xl font-bold text-ink-950">Compare packages</h2>

                  <div className="mt-6 hidden lg:block card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-paper-200 bg-paper-50">
                          <th className="text-left font-semibold text-ink-950 px-5 py-4">Feature</th>
                          {packages.map((pkg) => (
                            <th key={pkg.id} className="text-center font-semibold text-ink-950 px-5 py-4">
                              {pkg.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-paper-200">
                          <td className="px-5 py-3.5 text-ink-700">Speed</td>
                          {packages.map((pkg) => (
                            <td key={pkg.id} className="px-5 py-3.5 text-center text-ink-950 font-medium">
                              {pkg.speed_mbps} Mbps
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-paper-200">
                          <td className="px-5 py-3.5 text-ink-700">Price</td>
                          {packages.map((pkg) => (
                            <td key={pkg.id} className="px-5 py-3.5 text-center text-ink-950 font-medium">
                              KES {Number(pkg.price_kes).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        {allFeatures.map((feature) => (
                          <tr key={feature} className="border-b border-paper-200 last:border-b-0">
                            <td className="px-5 py-3.5 text-ink-700">{feature}</td>
                            {packages.map((pkg) => (
                              <td key={pkg.id} className="px-5 py-3.5 text-center">
                                {pkg.features?.includes(feature) ? (
                                  <span className="inline-flex text-signal-500"><CheckIcon /></span>
                                ) : (
                                  <span className="text-ink-700/30">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 lg:hidden space-y-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="card p-5">
                        <p className="font-semibold text-ink-950">{pkg.name}</p>
                        <dl className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-ink-700">Speed</dt>
                            <dd className="font-medium text-ink-950">{pkg.speed_mbps} Mbps</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-ink-700">Price</dt>
                            <dd className="font-medium text-ink-950">KES {Number(pkg.price_kes).toLocaleString()}</dd>
                          </div>
                          {allFeatures.map((feature) => (
                            <div key={feature} className="flex justify-between gap-3">
                              <dt className="text-ink-700">{feature}</dt>
                              <dd>
                                {pkg.features?.includes(feature) ? (
                                  <span className="text-signal-500"><CheckIcon /></span>
                                ) : (
                                  <span className="text-ink-700/30">—</span>
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 mt-0.5 text-signal-500">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
