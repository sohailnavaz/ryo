'use client';
import { OfflinePackScreen } from '@bnb/features';

// Offline Stay Pack — the page a traveler can open with no signal: their trip,
// the destination's emergency numbers, and offline-readable help. Precached by
// the service worker (/sw.js) so it loads without a network.
export default function Page() {
  return <OfflinePackScreen />;
}
