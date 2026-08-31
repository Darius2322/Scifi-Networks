import Link from 'next/link';

const NAV = [
  { href: '/packages', label: 'Packages' },
  { href: '/get-connected', label: 'Get Connected' },
  { href: '/track', label: 'Track Request' },
  { href: '/status', label: 'Network Status' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-ink-950/10 bg-paper-50/95 backdrop-blur supports-[backdrop-filter]:bg-paper-50/80 sticky top-0 z-40">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink-950">
          <LogoMark />
          SciFi Networks
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-800">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-signal-500 transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/get-connected"
          className="hidden md:inline-flex items-center rounded-sm bg-signal-500 px-4 py-2 text-sm font-medium text-white hover:bg-signal-600 transition-colors"
        >
          Get Connected
        </Link>

        <MobileNav />
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="20" r="1.8" fill="#1E6FE0" />
      <path d="M8 15.5C10.5 13 15.5 13 18 15.5" stroke="#1E6FE0" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 11.5C9.5 6.8 16.5 6.8 21.5 11.5" stroke="#0B1220" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MobileNav() {
  // Minimal, dependency-free mobile menu using a details/summary disclosure
  // so it works without client JS, then progressively enhanced if needed.
  return (
    <details className="md:hidden relative">
      <summary className="list-none cursor-pointer p-2 -mr-2" aria-label="Open menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="#0B1220" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="fixed inset-x-0 top-16 bottom-0 bg-paper-50 border-t border-ink-950/10 p-5 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 text-base font-medium text-ink-950 border-b border-ink-950/5"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/get-connected"
            className="mt-4 inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-3 text-sm font-medium text-white"
          >
            Get Connected
          </Link>
        </nav>
      </div>
    </details>
  );
}
