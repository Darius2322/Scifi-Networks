import type { Metadata } from 'next';
import Image from 'next/image';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActiveSites } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'SciFi Networks provides reliable Internet connectivity built around real local support, not just infrastructure.',
};

export default async function AboutPage() {
  const sites = await getActiveSites();

  return (
    <>
      <SiteHeader />
      <main className="container-page section-py max-w-2xl">
        <p className="eyebrow">About</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink-950">About SciFi Networks</h1>

        <div className="mt-8 relative aspect-[16/9] overflow-hidden rounded-2xl bg-paper-200">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop"
            alt="Technician installing home internet connectivity equipment"
            fill
            sizes="(min-width: 1024px) 60vw, 90vw"
            className="object-cover"
          />
        </div>

        <div className="mt-8 space-y-6 text-ink-800 leading-relaxed">
          <p>
            SciFi Networks started with a simple frustration: too many Internet providers treat
            installation as the finish line, then disappear the moment something goes wrong. We
            built this company around the opposite idea — that a connection is only as good as the
            support behind it.
          </p>

          <p>
            We run our own local sites rather than reselling someone else's network, which means
            when you report a problem, you're talking to the people who can actually fix it —
            not a call center reading from a script.
          </p>

          <h2 className="font-display text-xl font-bold text-ink-950 pt-4">Where we operate</h2>
          <p>
            We currently serve {sites.map((s) => s.name).join(' and ')}
            {sites.length > 0 ? ', with more locations planned as demand grows.' : '.'} Each site
            has its own manager, technicians, and inventory — so decisions get made locally, fast.
          </p>

          <h2 className="font-display text-xl font-bold text-ink-950 pt-4">Our agent program</h2>
          <p>
            In each area we work with local agents who help look after equipment and flag problems
            early — often before they'd otherwise be reported. It's a small program with an
            outsized impact on how quickly we catch issues.
          </p>

          <h2 className="font-display text-xl font-bold text-ink-950 pt-4">Reliability, honestly stated</h2>
          <p>
            We don't promise perfect uptime — no network can. What we do promise is transparency:
            our <a href="/status" className="text-signal-600 hover:text-ink-950 font-medium">network status page</a> reflects
            real conditions, and every support ticket you raise gets a real person and a ticket
            number you can track.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
