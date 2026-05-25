'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker (/sw.js) once on the client. Keeps the
 * app installable + offline-capable so a traveler with no signal can still
 * reach their stay pack at /offline. No-op on the server and where the
 * Service Worker API is unavailable.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Best-effort — offline is an enhancement, never a hard dependency.
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
