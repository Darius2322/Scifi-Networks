import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

// Display face: Fraunces — a serif with real texture, used sparingly for
// headlines only, to avoid the generic geometric-sans-everywhere ISP look.
const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://scifinetworks.vercel.app'),
  title: {
    default: 'SciFi Networks — Reliable Internet, Built Around You',
    template: '%s | SciFi Networks',
  },
  description:
    'SciFi Networks provides reliable home and business Internet across Kemera, Nyanchwa, and growing service areas. Get connected, track your request, and get support — all in one place.',
  openGraph: {
    title: 'SciFi Networks — Reliable Internet, Built Around You',
    description: 'A network that everyone is using but you are not.',
    siteName: 'SciFi Networks',
    type: 'website',
  },
  manifest: '/manifest.json',
  themeColor: '#0B1220',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
