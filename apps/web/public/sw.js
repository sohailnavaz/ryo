/* Ryo service worker — offline stay pack.
 *
 * Strategy:
 *   - Static assets (Next.js _next/static, icons, manifest, fonts, images):
 *     cache-first — fast, and they are content-hashed so safe to keep.
 *   - Navigations / pages (HTML): network-first, falling back to the cached
 *     copy when the network is unavailable. The /offline route is precached so
 *     a traveler with no signal can always reach their stay pack.
 *
 * No backend changes — this only caches what the browser already fetched.
 */

const VERSION = 'ryo-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const PAGE_CACHE = `${VERSION}-pages`;

// App shell + the offline pack route. Best-effort — install must not fail if a
// route 404s during a partial deploy.
const SHELL_URLS = ['/', '/offline', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico|webmanifest)$/.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const shell = await caches.open(SHELL_CACHE);
      const fallback = (await shell.match(fallbackUrl)) || (await cache.match(fallbackUrl));
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let the browser deal with the rest
  // (Supabase, image CDNs, fonts on google domains, the concierge API, …).
  if (url.origin !== self.location.origin) return;

  // Never intercept API routes — they need the network and must not be cached.
  if (url.pathname.startsWith('/api/')) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Treat document navigations network-first with an offline fallback.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, PAGE_CACHE, '/offline'));
    return;
  }
});
