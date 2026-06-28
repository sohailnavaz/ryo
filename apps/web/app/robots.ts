import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ryo-web.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private / internal / auth surfaces — keep out of search.
      disallow: [
        '/admin',
        '/host',
        '/account',
        '/trips',
        '/booking',
        '/profile',
        '/notifications',
        '/offline',
        '/auth',
        '/sign-in',
        '/reset-password',
        '/api',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
