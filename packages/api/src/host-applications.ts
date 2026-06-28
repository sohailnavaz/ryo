// "Become a host" application flow — gated host onboarding.
//
// A guest applies → row in `host_applications` (status 'pending') → staff review
// elsewhere → on approval their `profiles.role` becomes 'host' → only then can
// they publish listings.
//
// Dual-path contract (mirrors ./bookings.ts + ./notifications-store.ts):
//   • Real signed-in Supabase session (NOT a demo identity) → reads/writes the
//     real `host_applications` table (RLS: applicant self, staff all).
//   • Demo / unconfigured Supabase → falls back to a localStorage store
//     (useSyncExternalStore), so the demo guest can walk the whole flow and the
//     demo admin can review it.
//
// The `host_applications` table is migrated (0003) but not yet in the generated
// db types, so table access is cast through an untyped client surface.

import { useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';
import { getDemoUser } from './demo-auth';
import { recordAudit } from './audit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HostApplicationStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export type HostApplication = {
  id: string;
  user_id: string;
  status: HostApplicationStatus;
  full_name: string;
  phone: string;
  country: string;
  city: string;
  property_type: string;
  property_city: string;
  property_country: string;
  headline: string;
  about: string;
  tax_id: string;
  tax_country: string;
  agreed_terms: boolean;
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** The applicant-supplied fields written on submit. */
export type HostApplicationInput = {
  full_name: string;
  phone: string;
  country: string;
  city: string;
  property_type: string;
  property_city: string;
  property_country: string;
  headline: string;
  about: string;
  tax_id: string;
  tax_country: string;
  agreed_terms: boolean;
};

export type HostApplicationDecision = 'approved' | 'rejected' | 'changes_requested';

// ---------------------------------------------------------------------------
// Real session resolution (excludes demo identities)
// ---------------------------------------------------------------------------

/** A *real* Supabase user id, or null for demo / unconfigured. Demo identities
 *  carry `app_metadata.demo === true`; only genuine sessions hit the table. */
async function realUserId(): Promise<string | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if ((user.app_metadata as { demo?: boolean } | undefined)?.demo === true) return null;
  return user.id;
}

/** Untyped table handle — `host_applications` isn't in the generated db types yet. */
function applicationsTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (getSupabase() as any).from('host_applications');
}

// ---------------------------------------------------------------------------
// Demo / unconfigured fallback store (localStorage, useSyncExternalStore)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bnb.host-applications';

type DemoState = {
  /** The current demo user's own application, if any. */
  mine: HostApplication | null;
  /** Seeded queue for the demo admin review console. */
  queue: HostApplication[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

/** A few realistic pending applications so the demo admin console isn't empty. */
function seedQueue(): HostApplication[] {
  const base: Omit<HostApplication, 'id' | 'user_id' | 'full_name' | 'city' | 'property_city'> = {
    status: 'pending',
    phone: '+1 555 0142',
    country: 'United States',
    property_type: 'Apartment',
    property_country: 'United States',
    headline: 'A calm, sunlit space minutes from the centre',
    about: 'I love hosting and looking after guests like family.',
    tax_id: '—',
    tax_country: 'United States',
    agreed_terms: true,
    reviewer_id: null,
    review_note: null,
    reviewed_at: null,
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
  };
  return [
    {
      ...base,
      id: 'ha-seed-1',
      user_id: 'u-demo-aanya',
      full_name: 'Aanya Rao',
      city: 'Lisbon',
      property_city: 'Lisbon',
      property_type: 'Apartment',
      property_country: 'Portugal',
      country: 'Portugal',
      tax_country: 'Portugal',
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
    {
      ...base,
      id: 'ha-seed-2',
      user_id: 'u-demo-thomas',
      full_name: 'Thomas Berg',
      city: 'Oslo',
      property_city: 'Oslo',
      property_type: 'Cabin',
      property_country: 'Norway',
      country: 'Norway',
      tax_country: 'Norway',
      status: 'changes_requested',
      review_note: 'Please add a phone number we can reach you on.',
      reviewed_at: daysAgo(1),
      created_at: daysAgo(4),
      updated_at: daysAgo(1),
    },
    {
      ...base,
      id: 'ha-seed-3',
      user_id: 'u-demo-yuki',
      full_name: 'Yuki Mori',
      city: 'Kyoto',
      property_city: 'Kyoto',
      property_type: 'House',
      property_country: 'Japan',
      country: 'Japan',
      tax_country: 'Japan',
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
    },
  ];
}

function freshState(): DemoState {
  return { mine: null, queue: seedQueue() };
}

let cached: DemoState = readStorage();
const listeners = new Set<() => void>();

function readStorage(): DemoState {
  if (typeof window === 'undefined') return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      mine: parsed.mine ?? null,
      queue: Array.isArray(parsed.queue) ? parsed.queue : seedQueue(),
    };
  } catch {
    return freshState();
  }
}

function writeStorage(s: DemoState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best-effort
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: DemoState) {
  cached = next;
  writeStorage(next);
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): DemoState {
  return cached;
}

const SERVER_STATE = freshState();
function serverSnapshot(): DemoState {
  return SERVER_STATE;
}

function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Demo: upsert the current demo user's application as pending. */
function demoSubmit(input: HostApplicationInput): HostApplication {
  const demo = getDemoUser();
  const userId = demo?.id ?? 'demo-guest';
  const existing = cached.mine;
  const app: HostApplication = {
    id: existing?.id ?? `ha-demo-${userId}`,
    user_id: userId,
    status: 'pending',
    full_name: input.full_name,
    phone: input.phone,
    country: input.country,
    city: input.city,
    property_type: input.property_type,
    property_city: input.property_city,
    property_country: input.property_country,
    headline: input.headline,
    about: input.about,
    tax_id: input.tax_id,
    tax_country: input.tax_country,
    agreed_terms: input.agreed_terms,
    reviewer_id: null,
    review_note: null,
    reviewed_at: null,
    created_at: existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
  };
  // Reflect into the admin queue too so the demo admin can review the demo guest.
  const queue = [app, ...cached.queue.filter((a) => a.id !== app.id)];
  commit({ mine: app, queue });
  return app;
}

/** Demo: staff review decision. */
function demoReview(args: {
  id: string;
  decision: HostApplicationDecision;
  note?: string;
}): void {
  const apply = (a: HostApplication): HostApplication =>
    a.id === args.id
      ? {
          ...a,
          status: args.decision,
          review_note: args.note ?? null,
          reviewed_at: nowIso(),
          updated_at: nowIso(),
        }
      : a;
  commit({
    mine: cached.mine ? apply(cached.mine) : null,
    queue: cached.queue.map(apply),
  });
}

// ---------------------------------------------------------------------------
// Applicant hooks
// ---------------------------------------------------------------------------

const MY_APPLICATION_KEY = ['host-application', 'mine'] as const;

async function fetchMyApplication(): Promise<HostApplication | null> {
  const uid = await realUserId();
  if (!uid) return null; // demo / unconfigured → caller uses the local store
  const { data, error } = await applicationsTable()
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  return (data as HostApplication | null) ?? null;
}

export type UseMyHostApplication = {
  application: HostApplication | null;
  status: HostApplicationStatus | null;
  isLoading: boolean;
  /** True when serving the local demo store (demo / unconfigured). */
  isPreview: boolean;
};

/** The current user's host application (or null). Real-backed when there's a
 *  genuine session; otherwise the seeded localStorage store. */
export function useMyHostApplication(): UseMyHostApplication {
  const local = useDemoState();
  const query = useQuery({
    queryKey: MY_APPLICATION_KEY,
    queryFn: fetchMyApplication,
    staleTime: 15_000,
  });

  // `query.data === undefined` → still resolving the session/row.
  // A real session resolves to a HostApplication | null (never undefined post-fetch).
  // We detect the demo path by: no real user id was found AND query settled to null
  // with no Supabase configured. Simpler: if Supabase isn't configured at all, use local.
  const supabaseConfigured = tryGetSupabase() !== null;

  // Real path: Supabase configured and the query returned an actual row.
  if (supabaseConfigured && query.data) {
    return {
      application: query.data,
      status: query.data.status,
      isLoading: query.isLoading,
      isPreview: false,
    };
  }

  // If Supabase is configured but there's no real session, `fetchMyApplication`
  // returns null. We still want the demo guest (app_metadata.demo) to see their
  // local application, so fall through to local whenever there's no real row.
  if (supabaseConfigured && query.data === null && !local.mine) {
    return { application: null, status: null, isLoading: query.isLoading, isPreview: false };
  }

  // Demo / unconfigured fallback.
  return {
    application: local.mine,
    status: local.mine?.status ?? null,
    isLoading: false,
    isPreview: true,
  };
}

/** Submit (upsert) the current user's host application; status → 'pending'. */
export function useSubmitHostApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HostApplicationInput): Promise<HostApplication> => {
      const uid = await realUserId();
      if (!uid) {
        // Demo / unconfigured → localStorage store.
        return demoSubmit(input);
      }
      const row = {
        user_id: uid,
        status: 'pending' as const,
        full_name: input.full_name,
        phone: input.phone,
        country: input.country,
        city: input.city,
        property_type: input.property_type,
        property_city: input.property_city,
        property_country: input.property_country,
        headline: input.headline,
        about: input.about,
        tax_id: input.tax_id,
        tax_country: input.tax_country,
        agreed_terms: input.agreed_terms,
        updated_at: nowIso(),
      };
      const { data, error } = await applicationsTable()
        .upsert(row, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (error) throw error;
      return data as HostApplication;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_APPLICATION_KEY });
      qc.invalidateQueries({ queryKey: ['host-application', 'can-publish'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Publish gate
// ---------------------------------------------------------------------------

async function fetchCanPublish(): Promise<boolean> {
  const supabase = tryGetSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && (user.app_metadata as { demo?: boolean } | undefined)?.demo !== true) {
      // Real session: host role OR an approved application qualifies.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      const role = (profile as { role?: string } | null)?.role;
      if (role === 'host' || role === 'staff' || role === 'admin') return true;
      const { data: app } = await applicationsTable()
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      return (app as { status?: string } | null)?.status === 'approved';
    }
  }
  // Demo / unconfigured: the demo host (and admin) role qualifies; a demo guest
  // qualifies once their local application is approved.
  const demo = getDemoUser();
  if (demo && (demo.role === 'host' || demo.role === 'staff' || demo.role === 'admin')) {
    return true;
  }
  return cached.mine?.status === 'approved';
}

/** True when the current user may publish listings: profiles.role==='host'
 *  (or staff/admin) OR an approved host application exists. In demo mode the
 *  host demo role qualifies. Used to gate listing creation. */
export function useCanPublishListings(): boolean {
  // Subscribe to the local store so demo approval flips the gate reactively.
  const local = useDemoState();
  const query = useQuery({
    queryKey: ['host-application', 'can-publish'],
    queryFn: fetchCanPublish,
    staleTime: 15_000,
  });
  if (typeof query.data === 'boolean') return query.data;
  // First-paint fallback (and demo path before the query resolves).
  const demo = getDemoUser();
  if (demo && (demo.role === 'host' || demo.role === 'staff' || demo.role === 'admin')) return true;
  return local.mine?.status === 'approved';
}

// ===========================================================================
// Admin hooks — imported by the admin agent by these EXACT names.
// ===========================================================================

const ADMIN_APPLICATIONS_KEY = ['admin', 'host-applications'] as const;

/** True when there's a real staff/admin Supabase session (not a demo identity). */
async function realStaffUserId(): Promise<string | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if ((user.app_metadata as { demo?: boolean } | undefined)?.demo === true) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = (data as { role?: string } | null)?.role;
  return role === 'staff' || role === 'admin' ? user.id : null;
}

async function fetchAdminApplications(
  status?: HostApplicationStatus,
): Promise<HostApplication[]> {
  const staffId = await realStaffUserId();
  if (staffId) {
    let q = applicationsTable().select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as HostApplication[];
  }
  // Demo / unconfigured → the seeded local queue.
  const all = cached.queue;
  return status ? all.filter((a) => a.status === status) : all;
}

/** List host applications for the staff review console. Real for a staff session;
 *  seeded demo queue otherwise. Pass a `status` to filter. */
export function useAdminHostApplications(status?: HostApplicationStatus) {
  // Subscribe so demo writes (submit / review) refresh the console live.
  const local = useDemoState();
  const query = useQuery({
    queryKey: [...ADMIN_APPLICATIONS_KEY, status ?? 'all'],
    queryFn: () => fetchAdminApplications(status),
    staleTime: 15_000,
  });
  // For the demo path, derive synchronously from the local store so the list is
  // always in sync with the latest mutation.
  const supabaseConfigured = tryGetSupabase() !== null;
  if (!supabaseConfigured) {
    const all = local.queue;
    const items = status ? all.filter((a) => a.status === status) : all;
    return { ...query, data: items as HostApplication[] };
  }
  return query;
}

export type ReviewHostApplicationArgs = {
  id: string;
  decision: HostApplicationDecision;
  note?: string;
};

/** Staff review of a host application. Updates the application row (status,
 *  reviewer_id, review_note, reviewed_at); on 'approved' also flips that user's
 *  `profiles.role` to 'host'. Writes a best-effort audit row. Demo falls back to
 *  the localStorage store. */
export function useAdminReviewHostApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: ReviewHostApplicationArgs): Promise<void> => {
      const staffId = await realStaffUserId();
      if (!staffId) {
        // Demo / unconfigured → localStorage store.
        demoReview(args);
        return;
      }
      const supabase = getSupabase();
      // Fetch the application so we know whose role to flip on approval.
      const { data: appRow, error: readErr } = await applicationsTable()
        .select('user_id')
        .eq('id', args.id)
        .maybeSingle();
      if (readErr) throw readErr;
      const applicantId = (appRow as { user_id?: string } | null)?.user_id ?? null;

      const { error: updErr } = await applicationsTable()
        .update({
          status: args.decision,
          reviewer_id: staffId,
          review_note: args.note ?? null,
          reviewed_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq('id', args.id);
      if (updErr) throw updErr;

      if (args.decision === 'approved' && applicantId) {
        const { error: roleErr } = await supabase
          .from('profiles')
          .update({ role: 'host' })
          .eq('id', applicantId);
        if (roleErr) throw roleErr;
      }

      // Best-effort audit — never blocks the decision.
      await recordAudit({
        action: `host_application.${args.decision}`,
        target: args.id,
        reason_code: args.decision,
        note: args.note,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_APPLICATIONS_KEY });
      qc.invalidateQueries({ queryKey: MY_APPLICATION_KEY });
      qc.invalidateQueries({ queryKey: ['host-application', 'can-publish'] });
    },
  });
}
