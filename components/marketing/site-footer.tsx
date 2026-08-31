import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-950/10 bg-ink-950 text-paper-100">
      <div className="container-page py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-white">SciFi Networks</p>
          <p className="mt-2 text-sm text-paper-200/70 max-w-[26ch]">
            A network that everyone is using but you are not.
          </p>
        </div>

        <FooterColumn
          title="Services"
          links={[
            { href: '/packages', label: 'Internet Packages' },
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
          ]}
        />

        <FooterColumn
          title="Locations"
          links={[
            { href: '/status#kemera', label: 'Kemera' },
            { href: '/status#nyanchwa', label: 'Nyanchwa' },
          ]}
        />
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 text-xs text-paper-200/60">
          © {new Date().getFullYear()} SciFi Networks. All rights reserved.
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
