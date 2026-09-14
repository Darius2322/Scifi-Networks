import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';

// Per design spec: Inter only, across every weight — 400 body, 500
// labels/nav, 600 buttons/subheadings, 700 major headings. One typeface
// keeps the interface calm and avoids a "templated" multi-font feel.
// --font-display is kept as an alias of the same font so existing
// components that reference font-display need no further changes.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://scifinetworks.vercel.app'),
  title: {
    default: 'SciFi Networks — Connect Beyond Limits',
    template: '%s | SciFi Networks',
  },
  description:
    'SciFi Networks provides fast, reliable home and business Internet across Kemera, Nyanchwa, and growing service areas. Get connected, track your request, and get support — all in one place.',
  openGraph: {
    title: 'SciFi Networks — Connect Beyond Limits',
    description: 'Fast, reliable internet built for the way you live, work and play.',
    siteName: 'SciFi Networks',
    type: 'website',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#111111',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Sets the theme before first paint, defaulting to light (the
            off-white/charcoal design direction), so there's no flash of the
            wrong theme while the ThemeToggle component hydrates. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('scifi-theme');
                  var theme = stored === 'dark' ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
