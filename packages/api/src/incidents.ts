// Support → incident loop (docs/14 §3.6, docs/11 trust & safety).
//
// A guest taps "Get help" from a trip → an incident is opened with the booking
// context attached. The guest then tracks its status + SLA; the same incident
// surfaces in the admin queue (./admin.ts) and on the host's listing.
//
// Dual-path, like the rest of the v2-preview slice:
//   • Supabase wired  → real `incidents` + `incident_events` rows, gated by RLS
//     (guest sees own, host sees their listings', staff see all). Requested from
//     L1 — see the L4 schema block in AGENTS_TODO.
//   • not wired (demo) → ./incident-store.ts (localStorage), so the loop is fully
//     demonstrable today.
//
// `tryGetSupabase()` decides which path runs, so typecheck + the dev demo stay
// green now and the real path lights up automatically once L1 ships the tables.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tryGetSupabase } from './client';
import {
  addLocalIncident,
  appendLocalEvent,
  getLocalIncidentEvents,
  getLocalIncidents,
  hasLocalIncident,
  setLocalIncidentStatus,
} from './incident-store';

export type IncidentTier = 1 | 2 | 3;
export type IncidentStatus = 'new' | 'assigned' | 'in_progress' | 'resolved';
export type IncidentCategory =
  | 'safety'
  | 'lockout'
  | 'payment'
  | 'cleanliness'
  | 'listing_mismatch'
  | 'cancellation'
  | 'other';

export type Incident = {
  id: string;
  guest_id: string;
  guest_name: string;
  booking_id: string | null;
  listing_id: string | null;
  listing_title: string | null;
  host_id: string | null;
  host_name: string | null;
  category: IncidentCategory;
  tier: IncidentTier;
  status: IncidentStatus;
  subject: string;
  detail: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type IncidentEventKind =
  | 'opened'
  | 'status_change'
  | 'assignment'
  | 'note'
  | 'message'
  | 'resolved';

export type IncidentEvent = {
  id: string;
  incident_id: string;
  kind: IncidentEventKind;
  body: string;
  actor: string;
  created_at: string;
};

// --- category → tier + presentation ----------------------------------------

export const INCIDENT_CATEGORIES: Array<{
  code: IncidentCategory;
  label: string;
  hint: string;
}> = [
  { code: 'safety', label: 'Safety concern', hint: "I feel unsafe or there's an emergency at the property" },
  { code: 'lockout', label: "Can't get in", hint: 'Locked out, wrong code, or host unreachable on arrival' },
  { code: 'listing_mismatch', label: "Not as described", hint: "The place doesn't match the listing" },
  { code: 'cleanliness', label: 'Cleanliness', hint: 'The home was not clean when I arrived' },
  { code: 'payment', label: 'Payment or charge', hint: 'A charge looks wrong or I was billed twice' },
  { code: 'cancellation', label: 'Cancellation help', hint: 'I need to cancel or the host cancelled on me' },
  { code: 'other', label: 'Something else', hint: 'Anything not covered above' },
];

const CATEGORY_TIER: Record<IncidentCategory, IncidentTier> = {
  safety: 1,
  lockout: 1,
  listing_mismatch: 2,
  cleanliness: 2,
  payment: 2,
  cancellation: 2,
  other: 3,
};

export function tierForCategory(category: IncidentCategory): IncidentTier {
  return CATEGORY_TIER[category] ?? 3;
}

export function categoryLabel(category: IncidentCategory): string {
  return INCIDENT_CATEGORIES.find((c) => c.code === category)?.label ?? category;
}

// --- SLA --------------------------------------------------------------------
// First-response targets by tier (minutes). Tier 1 = active impact.

const SLA_TARGET_MINUTES: Record<IncidentTier, number> = {
  1: 60, // 1 hour
  2: 8 * 60, // 8 hours
  3: 24 * 60, // 1 day
};

export type IncidentSlaState = 'resolved' | 'on_track' | 'due_soon' | 'breached';

export type IncidentSla = {
  target_minutes: number;
  due_at: string;
  remaining_minutes: number;
  state: IncidentSlaState;
  label: string;
};

function humanizeMinutes(min: number): string {
  const abs = Math.abs(Math.round(min));
  if (abs < 60) return `${abs}m`;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function incidentSla(incident: Pick<Incident, 'tier' | 'created_at' | 'status'>): IncidentSla {
  const target = SLA_TARGET_MINUTES[incident.tier];
  const opened = new Date(incident.created_at).getTime();
  const dueAt = opened + target * 60_000;
  const remaining = (dueAt - Date.now()) / 60_000;

  let state: IncidentSlaState;
  let label: string;
  if (incident.status === 'resolved') {
    state = 'resolved';
    label = 'Resolved';
  } else if (remaining < 0) {
    state = 'breached';
    label = `SLA breached ${humanizeMinutes(remaining)} ago`;
  } else if (remaining < target * 0.25) {
    state = 'due_soon';
    label = `Response due in ${humanizeMinutes(remaining)}`;
  } else {
    state = 'on_track';
    label = `On track · ${humanizeMinutes(remaining)} to first response`;
  }

  return {
    target_minutes: target,
    due_at: new Date(dueAt).toISOString(),
    remaining_minutes: Math.round(remaining),
    state,
    label,
  };
}

// --- query keys -------------------------------------------------------------

export const INCIDENT_QUERY_KEYS = ['my-incidents', 'incident', 'incident-events', 'host-incidents'];

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// --- create -----------------------------------------------------------------

export type CreateIncidentInput = {
  guest_id: string;
  guest_name: string;
  category: IncidentCategory;
  subject: string;
  detail: string;
  booking_id?: string | null;
  listing_id?: string | null;
  listing_title?: string | null;
  host_id?: string | null;
  host_name?: string | null;
};

export async function createIncident(input: CreateIncidentInput): Promise<Incident> {
  const tier = tierForCategory(input.category);
  const now = new Date().toISOString();
  const sb = tryGetSupabase();

  if (sb) {
    const { data, error } = await sb
      .from('incidents')
      .insert({
        guest_id: input.guest_id,
        booking_id: input.booking_id ?? null,
        listing_id: input.listing_id ?? null,
        host_id: input.host_id ?? null,
        category: input.category,
        tier,
        status: 'new',
        subject: input.subject,
        detail: input.detail,
      })
      .select()
      .single();
    if (error) throw error;
    // Opening event — best-effort; the incident itself is the source of truth.
    await sb.from('incident_events').insert({
      incident_id: data.id,
      kind: 'opened',
      body: input.detail,
      actor_id: input.guest_id,
      actor_label: input.guest_name,
    });
    return rowToIncident(data, input);
  }

  // Fallback: localStorage so the demo loop works without a backend.
  const incident: Incident = {
    id: localId('inc'),
    guest_id: input.guest_id,
    guest_name: input.guest_name,
    booking_id: input.booking_id ?? null,
    listing_id: input.listing_id ?? null,
    listing_title: input.listing_title ?? null,
    host_id: input.host_id ?? null,
    host_name: input.host_name ?? null,
    category: input.category,
    tier,
    status: 'new',
    subject: input.subject,
    detail: input.detail,
    assigned_to: null,
    created_at: now,
    updated_at: now,
    resolved_at: null,
  };
  addLocalIncident(incident, {
    id: localId('ev'),
    incident_id: incident.id,
    kind: 'opened',
    body: input.detail,
    actor: input.guest_name,
    created_at: now,
  });
  return incident;
}

function rowToIncident(row: Record<string, unknown>, input?: Partial<CreateIncidentInput>): Incident {
  return {
    id: String(row.id),
    guest_id: String(row.guest_id ?? ''),
    guest_name: input?.guest_name ?? String((row.guest_name as string) ?? 'Guest'),
    booking_id: (row.booking_id as string) ?? null,
    listing_id: (row.listing_id as string) ?? null,
    listing_title: input?.listing_title ?? ((row.listing_title as string) ?? null),
    host_id: (row.host_id as string) ?? null,
    host_name: input?.host_name ?? ((row.host_name as string) ?? null),
    category: (row.category as IncidentCategory) ?? 'other',
    tier: (row.tier as IncidentTier) ?? 3,
    status: (row.status as IncidentStatus) ?? 'new',
    subject: String(row.subject ?? ''),
    detail: String(row.detail ?? ''),
    assigned_to: (row.assigned_to as string) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    resolved_at: (row.resolved_at as string) ?? null,
  };
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      for (const key of [...INCIDENT_QUERY_KEYS, 'admin-incidents', 'admin-dashboard']) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

// --- status updates (used by admin + concierge) -----------------------------

/**
 * Move an incident's status, recording an event. Returns `true` when this layer
 * owns the incident (real row, or a guest-created local one). Returns `false`
 * for the synthetic seed incidents the admin console ships with — those are
 * handled by ./admin-store's override map instead.
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus,
  actor: string,
  note?: string,
  assigned_to?: string | null,
): Promise<boolean> {
  const sb = tryGetSupabase();
  if (sb) {
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (assigned_to !== undefined) patch.assigned_to = assigned_to;
    if (status === 'resolved') patch.resolved_at = new Date().toISOString();
    const { error } = await sb.from('incidents').update(patch).eq('id', incidentId);
    if (error) throw error;
    await sb.from('incident_events').insert({
      incident_id: incidentId,
      kind: status === 'resolved' ? 'resolved' : 'status_change',
      body: note ?? `Status → ${status.replace('_', ' ')}`,
      actor_label: actor,
    });
    return true;
  }

  if (hasLocalIncident(incidentId)) {
    setLocalIncidentStatus(incidentId, status, assigned_to);
    appendLocalEvent(incidentId, {
      id: localId('ev'),
      incident_id: incidentId,
      kind: status === 'resolved' ? 'resolved' : 'status_change',
      body: note ?? `Status → ${status.replace('_', ' ')}`,
      actor,
      created_at: new Date().toISOString(),
    });
    return true;
  }

  return false;
}

export async function addIncidentNote(
  incidentId: string,
  body: string,
  actor: string,
): Promise<boolean> {
  const sb = tryGetSupabase();
  if (sb) {
    const { error } = await sb
      .from('incident_events')
      .insert({ incident_id: incidentId, kind: 'note', body, actor_label: actor });
    if (error) throw error;
    return true;
  }
  if (hasLocalIncident(incidentId)) {
    appendLocalEvent(incidentId, {
      id: localId('ev'),
      incident_id: incidentId,
      kind: 'note',
      body,
      actor,
      created_at: new Date().toISOString(),
    });
    return true;
  }
  return false;
}

// --- reads ------------------------------------------------------------------

export function useMyIncidents(guestId: string | undefined) {
  return useQuery({
    queryKey: ['my-incidents', guestId ?? ''],
    enabled: !!guestId,
    queryFn: async (): Promise<Incident[]> => {
      const sb = tryGetSupabase();
      if (sb) {
        const { data, error } = await sb
          .from('incidents')
          .select('*')
          .eq('guest_id', guestId!)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map((r) => rowToIncident(r));
      }
      return getLocalIncidents()
        .filter((i) => i.guest_id === guestId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    staleTime: 30_000,
  });
}

export function useHostIncidents(hostId: string | undefined) {
  return useQuery({
    queryKey: ['host-incidents', hostId ?? ''],
    enabled: !!hostId,
    queryFn: async (): Promise<Incident[]> => {
      const sb = tryGetSupabase();
      if (sb) {
        const { data, error } = await sb
          .from('incidents')
          .select('*')
          .eq('host_id', hostId!)
          .neq('status', 'resolved')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map((r) => rowToIncident(r));
      }
      return getLocalIncidents()
        .filter((i) => i.host_id === hostId && i.status !== 'resolved')
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    staleTime: 30_000,
  });
}

export function useIncident(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident', incidentId ?? ''],
    enabled: !!incidentId,
    queryFn: async (): Promise<Incident | null> => {
      const sb = tryGetSupabase();
      if (sb) {
        const { data, error } = await sb
          .from('incidents')
          .select('*')
          .eq('id', incidentId!)
          .maybeSingle();
        if (error) throw error;
        return data ? rowToIncident(data) : null;
      }
      return getLocalIncidents().find((i) => i.id === incidentId) ?? null;
    },
    staleTime: 30_000,
  });
}

export function useIncidentEvents(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-events', incidentId ?? ''],
    enabled: !!incidentId,
    queryFn: async (): Promise<IncidentEvent[]> => {
      const sb = tryGetSupabase();
      if (sb) {
        const { data, error } = await sb
          .from('incident_events')
          .select('*')
          .eq('incident_id', incidentId!)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return (data ?? []).map((r) => ({
          id: String(r.id),
          incident_id: String(r.incident_id),
          kind: (r.kind as IncidentEventKind) ?? 'note',
          body: String(r.body ?? ''),
          actor: String(r.actor_label ?? 'system'),
          created_at: String(r.created_at),
        }));
      }
      return getLocalIncidentEvents(incidentId!);
    },
    staleTime: 30_000,
  });
}

/** Non-hook read used by ./admin.ts to fold guest-created incidents into the queue. */
export function getCreatedIncidents(): Incident[] {
  return getLocalIncidents();
}
