import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActivePackages, getHotspotRequirements } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'Hotspot Internet',
  description: 'Pay-as-you-go Hotspot Internet from SciFi Networks — fast setup, flexible plans, no long-term commitment.',
};

export const revalidate = 60;

export default async function HotspotPage() {
  const [packages, requirements] = await Promise.all([
    getActivePackages('hotspot'),
    getHotspotRequirements(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Hotspot Internet</h1>
        <p className="mt-2 text-ink-800/80 max-w-prose">
          Quick, flexible Internet access with no long-term contract — ideal for short stays,
          events, or as a backup connection.
        </p>

        {requirements.length > 0 && (
          <div className="mt-8 border border-ink-950/10 p-6 max-w-2xl">
            <h2 className="font-medium text-ink-950">What you'll need</h2>
            <ul className="mt-3 space-y-2">
              {requirements.map((r) => (
                <li key={r.id} className="flex gap-2 text-sm">
                  <span className="text-signal-500">–</span>
                  <div>
                    <span className="text-ink-950">{r.title}</span>
                    {r.description && <p className="text-ink-800/60">{r.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {packages.length === 0 ? (
          <p className="mt-10 text-ink-800/70">
            Hotspot packages aren't available right now. Please check back shortly.
          </p>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <div key={pkg.id} className="border border-ink-950/10 p-6 flex flex-col">
                <p className="font-display text-lg font-semibold text-ink-950">{pkg.name}</p>
                <p className="mt-1 text-sm text-ink-800/70">{pkg.speed_mbps} Mbps</p>
                <p className="mt-5 font-display text-3xl font-semibold text-ink-950">
                  KES {Number(pkg.price_kes).toLocaleString()}
                  <span className="text-sm font-body font-normal text-ink-800/60"> / {pkg.duration_days} days</span>
                </p>
                {pkg.description && <p className="mt-3 text-sm text-ink-800/80">{pkg.description}</p>}
                <Link
                  href={`/get-connected?package=${pkg.id}`}
                  className="mt-6 inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors"
                >
                  Get This Plan
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
