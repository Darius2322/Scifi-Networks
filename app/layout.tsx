import type { Metadata, Viewport } from 'next';
import { Manrope, Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';

// Per design spec: Manrope for headings (a little personality), Inter for
// everything else (body, forms, dashboards, numbers) — stays highly
// readable across phones, tablets, and desktops in both themes.
const display = Manrope({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
