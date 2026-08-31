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

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Internet Packages</h1>
        <p className="mt-2 text-ink-800/80 max-w-prose">
          Pricing and availability are managed by our team and may vary by location.
          Choose a package below to start your installation request.
        </p>

        {packages.length === 0 ? (
          <p className="mt-10 text-ink-800/70">
            No packages are available right now. Please check back shortly, or contact us directly.
          </p>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <div key={pkg.id} className="border border-ink-950/10 p-6 flex flex-col">
                <p className="font-display text-lg font-semibold text-ink-950">{pkg.name}</p>
                <p className="mt-1 text-sm text-ink-800/70">{pkg.speed_mbps} Mbps</p>
                <p className="mt-5 font-display text-3xl font-semibold text-ink-950">
                  KES {Number(pkg.price_kes).toLocaleString()}
                  <span className="text-sm font-body font-normal text-ink-800/60">
                    {' '}/ {pkg.duration_days} days
                  </span>
                </p>
                {pkg.description && <p className="mt-3 text-sm text-ink-800/80">{pkg.description}</p>}
                {pkg.features?.length > 0 && (
                  <ul className="mt-4 space-y-1.5 text-sm text-ink-800/80">
                    {pkg.features.map((f: string) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-signal-500">–</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/get-connected?package=${pkg.id}`}
                  className="mt-6 inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors"
                >
                  Get Connected
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
