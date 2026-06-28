import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';
import { LocaleDirection } from './_components/LocaleDirection';
import { CookieConsent } from './_components/CookieConsent';
import { StructuredData } from './_components/StructuredData';

// Body — Inter (clean, multilingual). Display — Fraunces (soft editorial serif
// that carries the brand character). Per docs/branding.md §7.3.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ryo-web.vercel.app';
const SITE_NAME = 'Ryo';
const SITE_DESC =
  'Vetted hosts, a 24/7 concierge, and honest pricing — find and book places to stay around the world. Just Ryo it.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Ryo — stay anywhere, and feel hosted',
    template: '%s · Ryo',
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    'vacation rentals',
    'short-term stays',
    'places to stay',
    'travel',
    'book a stay',
    'holiday homes',
    'concierge travel',
    'Ryo',
  ],
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ryo',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: 'Ryo — stay anywhere, and feel hosted',
    description: SITE_DESC,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ryo — Just Ryo it.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ryo — stay anywhere, and feel hosted',
    description: SITE_DESC,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAF6F0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-surface text-ink antialiased">
        <ServiceWorkerRegister />
        <StructuredData />
        <LocaleDirection />
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
