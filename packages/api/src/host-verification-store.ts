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
// + localStorage. When this slice graduates to real v2, every mutator below is
// replaced by a Supabase write + RLS check (and a real KYC webhook) and this file
// is deleted (per the 2026-04-25 v2-preview deviation).

import { useSyncExternalStore } from 'react';

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

/** Lifecycle of a single KYC check. */
export type KycStatus = 'not_started' | 'pending' | 'verified';

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

// --- mutators ---------------------------------------------------------------

/** Save (or replace) the host's payout method. */
export function savePayoutMethod(
  method: Omit<PayoutMethod, 'saved_at'>,
): void {
  commit({ ...cached, payoutMethod: { ...method, saved_at: nowStamp() } });
}

/** Remove the saved payout method. */
export function clearPayoutMethod(): void {
  commit({ ...cached, payoutMethod: null });
}

/** Change how often payouts are released. */
export function setPayoutSchedule(schedule: PayoutSchedule): void {
  commit({ ...cached, payoutSchedule: schedule });
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

export function useHostVerification(): HostVerificationState {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
