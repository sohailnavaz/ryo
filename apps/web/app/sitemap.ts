import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ryo-web.vercel.app';

// Public, indexable routes (private/auth surfaces are excluded in robots.ts).
// Tuple: [path, priority, changeFrequency].
const ROUTES: Array<[string, number, MetadataRoute.Sitemap[number]['changeFrequency']]> = [
  ['', 1, 'daily'],
  ['/discover', 0.8, 'weekly'],
  ['/stories', 0.7, 'weekly'],
  ['/concierge', 0.7, 'monthly'],
  ['/faq', 0.7, 'monthly'],
  ['/help', 0.6, 'monthly'],
  ['/phrasebook', 0.6, 'monthly'],
  ['/legal', 0.4, 'yearly'],
  ['/legal/privacy', 0.4, 'yearly'],
  ['/legal/terms', 0.4, 'yearly'],
  ['/legal/cookies', 0.4, 'yearly'],
  ['/legal/security', 0.5, 'yearly'],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map(([path, priority, changeFrequency]) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
