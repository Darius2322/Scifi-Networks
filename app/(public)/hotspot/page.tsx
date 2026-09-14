import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
      <main>
        <div className="border-b border-paper-200 bg-paper-100">
          <div className="container-page section-py">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div>
                <p className="eyebrow">Hotspot</p>
                <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink-950">Hotspot Internet</h1>
                <p className="mt-3 text-ink-700 max-w-prose">
                  Quick, flexible Internet access with no long-term contract — ideal for short stays,
                  events, or as a backup connection.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/get-connected" className="btn-primary">
                    Request Hotspot Service
                  </Link>
                  <Link href="/report-issue" className="btn-secondary">
                    Report an Issue
                  </Link>
                </div>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-200">
                <Image
                  src="https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?q=80&w=1000&auto=format&fit=crop"
                  alt="Person using a mobile hotspot connection outdoors"
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container-page section-py">
          {requirements.length > 0 && (
            <div className="card p-6 max-w-2xl">
              <h2 className="font-semibold text-ink-950">What you'll need</h2>
              <ul className="mt-3 space-y-2">
                {requirements.map((r) => (
                  <li key={r.id} className="flex gap-2 text-sm">
                    <span className="text-signal-600">–</span>
                    <div>
                      <span className="text-ink-950">{r.title}</span>
                      {r.description && <p className="text-ink-700">{r.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {packages.length === 0 ? (
            <p className="mt-10 text-ink-700">
              Hotspot packages aren't available right now. Please check back shortly.
            </p>
          ) : (
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {packages.map((pkg) => (
                <div key={pkg.id} className="card card-hover flex flex-col p-6">
                  <p className="font-display text-lg font-semibold text-ink-950">{pkg.name}</p>
                  <p className="mt-1 text-sm text-ink-700">{pkg.speed_mbps} Mbps</p>
                  <p className="mt-5 font-display text-3xl font-bold text-ink-950">
                    KES {Number(pkg.price_kes).toLocaleString()}
                    <span className="text-sm font-medium text-ink-700"> / {pkg.duration_days} days</span>
                  </p>
                  {pkg.description && <p className="mt-3 text-sm text-ink-700 leading-relaxed">{pkg.description}</p>}
                  <Link href={`/get-connected?package=${pkg.id}`} className="btn-primary mt-6">
                    Request This Plan
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
