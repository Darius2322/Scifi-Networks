import Link from 'next/link';
import { getSiteSettings, getActiveSites } from '@/lib/data/public';
import { ShareButton } from '@/components/ui/share-button';

const SOCIAL_ICONS: Record<string, JSX.Element> = {
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.5-3H13.5V8.5c0-.9.3-1.5 1.6-1.5H16.5V4.3C16.2 4.3 15.1 4 13.9 4c-2.5 0-4.2 1.5-4.2 4.3V10.5H7v3h2.7V21H13.5z" />
    </svg>
  ),
  twitter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4l7.1 9.3L4.3 20h1.9l6-6.4 4.6 6.4H20l-7.4-9.8L19.1 4h-1.9l-5.5 6-4.3-6H4z" />
    </svg>
  ),
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="16.5" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 3v10.2a2.6 2.6 0 11-2.1-2.55V8.4a5 5 0 105 5V9.8a6 6 0 003.1.9V8.3a3.7 3.7 0 01-3.1-3.1V3H14z" />
    </svg>
  ),
};

export async function SiteFooter() {
  const [settings, sites] = await Promise.all([getSiteSettings(), getActiveSites()]);
  const social: Record<string, string> = settings.social_links ?? {};
  const activeSocial = Object.entries(social).filter(([, url]) => url);

  return (
    <footer className="border-t border-ink-950/10 bg-ink-950 text-paper-100">
      <div className="container-page py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-white">SciFi Networks</p>
          <p className="mt-2 text-sm text-paper-200/70 max-w-[26ch]">
            A network that everyone is using but you are not.
          </p>
          {activeSocial.length > 0 && (
            <div className="mt-4 flex gap-3">
              {activeSocial.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                  className="text-paper-200/70 hover:text-white transition-colors"
                >
                  {SOCIAL_ICONS[platform] ?? null}
                </a>
              ))}
            </div>
          )}
        </div>

        <FooterColumn
          title="Services"
          links={[
            { href: '/packages', label: 'Internet Packages' },
            { href: '/hotspot', label: 'Hotspot' },
            { href: '/get-connected', label: 'Get Connected' },
            { href: '/track', label: 'Track My Request' },
            { href: '/status', label: 'Network Status' },
          ]}
        />

        <FooterColumn
          title="Company"
          links={[
            { href: '/about', label: 'About Us' },
            { href: '/faq', label: 'FAQ' },
            { href: '/contact', label: 'Contact' },
            { href: '/terms', label: 'Terms & Conditions' },
          ]}
        />

        <FooterColumn
          title="Locations"
          links={sites.map((s) => ({ href: `/status#${s.slug}`, label: s.name }))}
        />
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 flex items-center justify-between text-xs text-paper-200/60">
          <span>© {new Date().getFullYear()} SciFi Networks. All rights reserved.</span>
          <ShareButton className="!text-paper-200/70 hover:!text-white" />
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-white">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-paper-200/70 hover:text-white transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
