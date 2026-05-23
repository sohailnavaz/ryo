'use client';

// Client-side fallback store for the support→incident loop (v2-preview).
//
// When a guest taps "Get help" but no Supabase project is wired (the current
// demo / preview environment), the incident they open can't hit a real table.
// This module persists guest-created incidents + their event timeline
// client-side so the whole loop is demonstrable end-to-end: guest opens an
// incident → it shows in their status tracker with an SLA → it appears in the
// admin queue → staff resolve it.
//
// Same pattern as ./admin-store.ts / ./demo-auth.ts — a module singleton backed
// by `useSyncExternalStore` + localStorage. When L1 lands the real `incidents`
// + `incident_events` tables + RLS, ./incidents.ts prefers Supabase and this
// store becomes the offline/preview fallback only (per the 2026-04-25
// v2-preview deviation).

import { useSyncExternalStore } from 'react';
import type { Incident, IncidentEvent, IncidentStatus } from './incidents';

const STORAGE_KEY = 'bnb.incident-store';

export type IncidentStoreState = {
  incidents: Incident[];
  events: Record<string, IncidentEvent[]>;
};

const EMPTY: IncidentStoreState = { incidents: [], events: {} };

let cached: IncidentStoreState = readStorage();
const listeners = new Set<() => void>();

function readStorage(): IncidentStoreState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<IncidentStoreState>) };
  } catch {
    return EMPTY;
  }
}

function writeStorage(s: IncidentStoreState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best-effort
  }
}

function commit(next: IncidentStoreState) {
  cached = next;
  writeStorage(next);
  listeners.forEach((l) => l());
}

// --- mutators ---------------------------------------------------------------

export function addLocalIncident(incident: Incident, opening: IncidentEvent): void {
  commit({
    incidents: [incident, ...cached.incidents],
    events: { ...cached.events, [incident.id]: [opening] },
  });
}

export function appendLocalEvent(incidentId: string, event: IncidentEvent): void {
  const existing = cached.events[incidentId] ?? [];
  commit({
    ...cached,
    events: { ...cached.events, [incidentId]: [...existing, event] },
  });
}

export function setLocalIncidentStatus(
  incidentId: string,
  status: IncidentStatus,
  assigned_to?: string | null,
): void {
  const now = new Date().toISOString();
  commit({
    ...cached,
    incidents: cached.incidents.map((i) =>
      i.id === incidentId
        ? {
            ...i,
            status,
            assigned_to: assigned_to !== undefined ? assigned_to : i.assigned_to,
            updated_at: now,
            resolved_at: status === 'resolved' ? now : i.resolved_at,
          }
        : i,
    ),
  });
}

export function resetIncidentStore(): void {
  commit(EMPTY);
}

// --- reads ------------------------------------------------------------------

export function hasLocalIncident(incidentId: string): boolean {
  return cached.incidents.some((i) => i.id === incidentId);
}

export function getLocalIncidents(): Incident[] {
  return cached.incidents;
}

export function getLocalIncidentEvents(incidentId: string): IncidentEvent[] {
  return cached.events[incidentId] ?? [];
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): IncidentStoreState {
  return cached;
}

function serverSnapshot(): IncidentStoreState {
  return EMPTY;
}

export function useIncidentStore(): IncidentStoreState {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
