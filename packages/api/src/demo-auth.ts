// Dev / preview demo authentication.
//
// OFF BY DEFAULT. Requires NEXT_PUBLIC_RYO_DEMO=1 and refuses to run when
// NODE_ENV=production, no matter what the flag says.
//
// Why the clamp-down: `DEMO_ADMIN` used to carry `role: 'admin'` in client-held
// metadata, `useRole()` trusted it with no server lookup, and `StaffGate` let it walk
// straight into /admin — on the live site. The database refused every actual read and
// write (each console RPC re-checks auth.uid() against a real JWT, and a demo user
// holds none), so it was a defense-in-depth failure rather than a breach. But it
// trained the guard to look like it worked, and the day someone adds a read hook that
// forgets its role check, it stops being theoretical.
//
// THERE IS NO DEMO ADMIN ANY MORE. A demo identity can never be staff or admin: those
// roles are only ever read from the server (`my_role()`), never from this file.
//
// Persists to localStorage on web so a page refresh keeps the demo identity.

import { useSyncExternalStore } from 'react';
import type { UserRole } from '@bnb/db';

const STORAGE_KEY = 'bnb.demo-user';

export type DemoUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
};

/**
 * Is the demo path allowed to exist at all?
 *
 * Fails CLOSED: unset flag → off. Production → off, flag or not. This is the switch
 * that was missing when a public deploy shipped an "Explore as Admin" button.
 */
export function isDemoEnabled(): boolean {
  const env = globalThis?.process?.env;
  if (env?.NODE_ENV === 'production') return false;
  return env?.NEXT_PUBLIC_RYO_DEMO === '1' || env?.NEXT_PUBLIC_RYO_DEMO === 'true';
}

/** Demo identities. Guest and host only — see the file header. */
export const DEMO_GUEST: DemoUser = {
  id: 'demo-guest-mira',
  email: 'mira@ryostays.local',
  full_name: 'Mira Guest',
  role: 'guest',
  avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
};

export const DEMO_HOST: DemoUser = {
  id: 'demo-host-kenji',
  email: 'kenji@ryostays.local',
  full_name: 'Kenji Host',
  role: 'host',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
};

// DEMO_ADMIN is deliberately gone. Staff access is never granted client-side.
export type DemoRole = 'guest' | 'host';

export const DEMO_USERS: Record<DemoRole, DemoUser> = {
  guest: DEMO_GUEST,
  host: DEMO_HOST,
};

/** Back-compat alias — existing callers default to the guest identity. */
export const DEFAULT_DEMO_USER: DemoUser = DEMO_GUEST;

let cached: DemoUser | null = readStorage();
const listeners = new Set<() => void>();

function readStorage(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

function writeStorage(u: DemoUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): DemoUser | null {
  return cached;
}

function serverSnapshot(): DemoUser | null {
  return null;
}

export function setDemoUser(u: DemoUser | null): void {
  cached = u;
  writeStorage(u);
  emit();
}

export function signInAsDemo(u: DemoUser = DEFAULT_DEMO_USER): void {
  if (!isDemoEnabled()) {
    throw new Error('[@bnb/api] Demo sign-in is disabled. Set NEXT_PUBLIC_RYO_DEMO=1 (non-production).');
  }
  setDemoUser(u);
}

/** Sign in as a demo guest / host / admin. */
export function signInAsRole(role: DemoRole): void {
  if (!isDemoEnabled()) {
    throw new Error('[@bnb/api] Demo sign-in is disabled. Set NEXT_PUBLIC_RYO_DEMO=1 (non-production).');
  }
  setDemoUser(DEMO_USERS[role]);
}

export function signOutDemo(): void {
  setDemoUser(null);
}

export function getDemoUser(): DemoUser | null {
  return cached;
}

export function useDemoUser(): DemoUser | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
