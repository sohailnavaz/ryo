// Dev / preview demo authentication.
// Only consulted when real Supabase isn't configured (no env vars set).
// Once a real Supabase project is wired (Phase M8 of the production plan),
// the demo-auth path is dormant — real sessions take precedence everywhere.
//
// Persists to localStorage on web so a page refresh keeps the demo identity.

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bnb.demo-user';

export type DemoUser = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
};

export const DEFAULT_DEMO_USER: DemoUser = {
  id: 'demo-mira',
  email: 'mira@ryostays.local',
  full_name: 'Mira Host',
  avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
};

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
  setDemoUser(u);
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
