import type { MetadataRoute } from 'next';

const BASE = 'https://ryo-web.vercel.app';

// Public, indexable routes only (private/auth surfaces are excluded in robots.ts).
const ROUTES = ['', '/stories', '/discover', '/concierge', '/phrasebook', '/help'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
