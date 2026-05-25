import type { MetadataRoute } from 'next';

const BASE = 'https://ryo-web.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private / internal surfaces — keep out of search.
      disallow: ['/admin', '/host', '/account', '/trips', '/booking', '/profile', '/offline'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
