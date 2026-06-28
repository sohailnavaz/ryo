// Client-side host payout + KYC store (v2-preview / auth-parked).
//
// The host site has no real payouts or KYC yet: real money rails + a KYC vendor
// (docs/06-payments-payouts.md, docs/02-auth-identity.md §4.3) are queued behind
// real host auth + RLS. Until then, the payout-method draft a host enters and the
// status of each KYC check are persisted *client-side* here so they survive a page
// refresh and reflect across the payouts + verification screens.
//
// Same pattern as ./admin-store.ts, ./host-actions-store.ts and
// ./host-calendar-store.ts — a module singleton backed by `useSyncExternalStore`
// + localStorage.
//
// REAL BACKEND (L3): for a genuine host session (not a demo identity), the store
// is hydrated from — and mutations are mirrored to — Supabase: payout method →
// `host_payout_methods` (upsert), KYC submit → `host_kyc_checks` (upsert, status
// 'pending'). The localStorage commit still runs for an instant optimistic
// reflection; `useHostVerification` reads stay synchronous. Demo identities
// (`app_metadata.demo === true`) have no rows to write, so only localStorage runs.

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { getSupabase, tryGetSupabase } from './client';

const STORAGE_KEY = 'bnb.host-verification';

/** How a host gets paid. UPI for India; bank transfer everywhere else. */
export type PayoutMethodKind = 'bank' | 'upi';

export type PayoutMethod = {
  kind: PayoutMethodKind;
  /** Display label, e.g. account-holder name. */
  account_name: string;
  /** Bank: account number (last digits kept). UPI: not used. */
  account_number?: string;
  /** Bank: IFSC / routing / SWIFT. UPI: not used. */
  routing_code?: string;
  /** UPI VPA, e.g. host@okhdfcbank. Bank: not used. */
  upi_id?: string;
  currency: string;
  saved_at: string;
};

/** How often payouts are released. */
export type PayoutSchedule = 'per_booking' | 'weekly' | 'monthly';

/** The four KYC checks a host must clear to be listed-eligible (docs/02 §4.3). */
export type KycCheckType = 'id' | 'selfie' | 'address' | 'property_right';

/** Lifecycle of a single KYC check (mirrors `host_kyc_checks.status`). */
export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export type KycCheck = {
  status: KycStatus;
  /** ID/address/property docs accept a URL or a stubbed reference. */
  reference?: string;
  updated_at: string;
};

export type HostVerificationState = {
  payoutMethod: PayoutMethod | null;
  payoutSchedule: PayoutSchedule;
  kyc: Record<KycCheckType, KycCheck>;
};

/** The four checks, in wizard order. */
export const KYC_CHECK_ORDER: KycCheckType[] = ['id', 'selfie', 'address', 'property_right'];

export const KYC_CHECK_LABELS: Record<KycCheckType, string> = {
  id: 'Government ID',
  selfie: 'Selfie liveness',
  address: 'Address proof',
  property_right: 'Property-ownership proof',
};

function emptyCheck(): KycCheck {
  return { status: 'not_started', updated_at: '' };
}

const EMPTY: HostVerificationState = {
  payoutMethod: null,
  payoutSchedule: 'monthly',
  kyc: {
    id: emptyCheck(),
    selfie: emptyCheck(),
    address: emptyCheck(),
    property_right: emptyCheck(),
  },
};

let cached: HostVerificationState = readStorage();
const listeners = new Set<() => void>();

function readStorage(): HostVerificationState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<HostVerificationState>;
    return {
      ...EMPTY,
      ...parsed,
      kyc: { ...EMPTY.kyc, ...(parsed.kyc ?? {}) },
    };
  } catch {
    return EMPTY;
  }
}

function writeStorage(s: HostVerificationState) {
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

function commit(next: HostVerificationState) {
  cached = next;
  writeStorage(next);
  emit();
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

// --- real backend (Supabase) ------------------------------------------------

/** A *real* Supabase user id, or null for demo / unconfigured. Demo identities
 *  carry `app_metadata.demo === true`; only genuine sessions hit the tables. */
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

type PayoutRow = {
  kind: PayoutMethodKind;
  account_name: string;
  account_number: string | null;
  routing_code: string | null;
  upi_id: string | null;
  currency: string;
  schedule: PayoutSchedule;
  saved_at: string;
};

type KycRow = {
  check_type: KycCheckType;
  status: KycStatus;
  reference: string | null;
  updated_at: string;
};

/** Hydrate the in-memory store from the host's real rows. No-ops for demo /
 *  unconfigured. Best-effort: a failed read leaves the localStorage state intact. */
async function hydrateRemote(): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  try {
    const supabase = getSupabase();
    const [{ data: payout }, { data: kycRows }] = await Promise.all([
      supabase
        .from('host_payout_methods')
        .select('kind, account_name, account_number, routing_code, upi_id, currency, schedule, saved_at')
        .eq('host_id', uid)
        .maybeSingle(),
      supabase
        .from('host_kyc_checks')
        .select('check_type, status, reference, updated_at')
        .eq('host_id', uid),
    ]);

    const next: HostVerificationState = {
      payoutMethod: cached.payoutMethod,
      payoutSchedule: cached.payoutSchedule,
      kyc: { ...cached.kyc },
    };

    if (payout) {
      const p = payout as PayoutRow;
      next.payoutMethod = {
        kind: p.kind,
        account_name: p.account_name,
        account_number: p.account_number ?? undefined,
        routing_code: p.routing_code ?? undefined,
        upi_id: p.upi_id ?? undefined,
        currency: p.currency,
        saved_at: p.saved_at,
      };
      next.payoutSchedule = p.schedule;
    }

    for (const row of (kycRows ?? []) as KycRow[]) {
      next.kyc[row.check_type] = {
        status: row.status,
        reference: row.reference ?? undefined,
        updated_at: row.updated_at,
      };
    }

    commit(next);
  } catch {
    // best-effort hydration; keep whatever localStorage already holds.
  }
}

async function remoteUpsertPayout(
  method: Omit<PayoutMethod, 'saved_at'>,
  schedule: PayoutSchedule,
): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase.from('host_payout_methods').upsert(
    {
      host_id: uid,
      kind: method.kind,
      account_name: method.account_name,
      account_number: method.account_number ?? null,
      routing_code: method.routing_code ?? null,
      upi_id: method.upi_id ?? null,
      currency: method.currency,
      schedule,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'host_id' },
  );
  if (error) throw error;
}

async function remoteSetSchedule(schedule: PayoutSchedule): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  // Only meaningful once a payout method row exists; update in place.
  const { error } = await supabase
    .from('host_payout_methods')
    .update({ schedule, updated_at: new Date().toISOString() })
    .eq('host_id', uid);
  if (error) throw error;
}

async function remoteClearPayout(): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase.from('host_payout_methods').delete().eq('host_id', uid);
  if (error) throw error;
}

async function remoteSubmitKyc(check: KycCheckType, reference?: string): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase.from('host_kyc_checks').upsert(
    {
      host_id: uid,
      check_type: check,
      status: 'pending',
      reference: reference ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'host_id,check_type' },
  );
  if (error) throw error;
}

/** Fire a remote write for a real host session; swallow errors so the optimistic
 *  localStorage commit remains the source of UI truth even if the write fails. */
function syncRemote(run: () => Promise<void>): void {
  void run().catch(() => {
    // best-effort; localStorage already reflects the change.
  });
}

// --- mutators ---------------------------------------------------------------

/** Save (or replace) the host's payout method. */
export function savePayoutMethod(
  method: Omit<PayoutMethod, 'saved_at'>,
): void {
  commit({ ...cached, payoutMethod: { ...method, saved_at: nowStamp() } });
  const schedule = cached.payoutSchedule;
  syncRemote(() => remoteUpsertPayout(method, schedule));
}

/** Remove the saved payout method. */
export function clearPayoutMethod(): void {
  commit({ ...cached, payoutMethod: null });
  syncRemote(() => remoteClearPayout());
}

/** Change how often payouts are released. */
export function setPayoutSchedule(schedule: PayoutSchedule): void {
  commit({ ...cached, payoutSchedule: schedule });
  syncRemote(() => remoteSetSchedule(schedule));
}

/** Submit a KYC check (with a URL/stub reference) → moves it to `pending`. */
export function submitKycCheck(check: KycCheckType, reference?: string): void {
  commit({
    ...cached,
    kyc: {
      ...cached.kyc,
      [check]: { status: 'pending', reference, updated_at: nowStamp() },
    },
  });
  syncRemote(() => remoteSubmitKyc(check, reference));
}

/** Force a KYC check status (preview-only: stands in for a vendor webhook). */
export function setKycStatus(check: KycCheckType, status: KycStatus): void {
  commit({
    ...cached,
    kyc: {
      ...cached.kyc,
      [check]: { ...cached.kyc[check], status, updated_at: nowStamp() },
    },
  });
}

export function resetHostVerification(): void {
  commit(EMPTY);
}

// --- reads ------------------------------------------------------------------

export function getHostVerification(): HostVerificationState {
  return cached;
}

/** True only when all four KYC checks are `verified` (listed-eligible). */
export function isHostListedEligible(s: HostVerificationState): boolean {
  return KYC_CHECK_ORDER.every((c) => s.kyc[c].status === 'verified');
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): HostVerificationState {
  return cached;
}

function serverSnapshot(): HostVerificationState {
  return EMPTY;
}

/** Tracks whether we've attempted a remote hydration this session, so the
 *  effect below runs the network read at most once. */
let hydrated = false;

export function useHostVerification(): HostVerificationState {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  // On first mount with a real session, pull the host's persisted payout method +
  // KYC rows over the localStorage seed. Demo / unconfigured sessions no-op inside
  // hydrateRemote, so the localStorage state stands.
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    void hydrateRemote();
  }, []);
  return state;
}
