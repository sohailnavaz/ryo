'use client';

// THE write path for every privileged action. (docs/15-admin-console.md §5)
//
// There is exactly one of these, and it is a Postgres function — not a REST route —
// because the state change, the hash-chained audit row, and the event row must land
// in ONE transaction. A sequence of PostgREST calls cannot give us that: a crash
// between call two and call three leaves a user suspended with no audit trail, which
// is precisely the failure the audit log exists to prevent.
//
// Permission is enforced in the database, not here. This module hides buttons; the
// database refuses writes. `admin_action()` re-checks the caller's role from their JWT
// on every call, so a forged request from a modified client simply fails.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminSubjectType = 'user' | 'listing' | 'review' | 'booking';

export type AdminActionName =
  | 'user.suspend'
  | 'user.reinstate'
  | 'user.grant_role'
  | 'listing.approve'
  | 'listing.request_changes'
  | 'listing.reject'
  | 'review.remove'
  | 'review.restore'
  | 'booking.cancel'
  | 'booking.refund';

/** What an action would touch. Shown to the operator BEFORE they commit. */
export type BlastRadius = {
  listings_affected?: number;
  upcoming_bookings: number;
  upcoming_booking_value_cents: number;
  guests_notified: number;
};

export type AdminActionInput = {
  action: AdminActionName;
  subjectType: AdminSubjectType;
  subjectId: string;
  reasonCode?: string;
  note?: string;
  payload?: Record<string, unknown>;
  /** Omit and one is generated. Pass your own to make a retry provably safe. */
  idempotencyKey?: string;
};

export type AdminActionPreview = {
  dry_run: true;
  action: AdminActionName;
  label: string;
  subject_type: AdminSubjectType;
  subject_id: string;
  blast_radius: BlastRadius;
  requires_approval: boolean;
  undo_window_minutes: number | null;
};

export type AdminActionApplied = {
  status: 'applied';
  action: AdminActionName;
  subject_type: AdminSubjectType;
  subject_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  blast_radius: BlastRadius;
  undo_until: string | null;
  audit_id: string;
  /** True when this call replayed a prior identical action instead of acting again. */
  replayed?: boolean;
};

export type AdminActionPendingApproval = {
  status: 'pending_approval';
  approval_id: string;
  action: AdminActionName;
  blast_radius: BlastRadius;
  message: string;
};

export type AdminActionResult = AdminActionApplied | AdminActionPendingApproval;

export type ReasonCode = {
  code: string;
  applies_to: AdminSubjectType;
  label: string;
  description: string;
};

export type RegisteredAction = {
  action: AdminActionName;
  label: string;
  subject_type: AdminSubjectType;
  requires_reason: boolean;
  admin_only: boolean;
  approval_threshold_cents: number | null;
  undo_window_minutes: number | null;
  enabled: boolean;
  disabled_reason: string | null;
};

export type PendingApproval = {
  id: string;
  action: AdminActionName;
  subject_type: AdminSubjectType;
  subject_id: string;
  payload: Record<string, unknown>;
  reason_code: string | null;
  note: string | null;
  requested_by: string;
  requested_at: string;
  expires_at: string;
};

// ---------------------------------------------------------------------------
// Errors — the database raises these with a machine-readable prefix so the UI can
// say something true rather than "Something went wrong".
// ---------------------------------------------------------------------------

export type AdminActionErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'UNKNOWN_ACTION'
  | 'NOT_ENABLED'
  | 'REASON_REQUIRED'
  | 'REASON_INVALID'
  | 'SUBJECT_NOT_FOUND'
  | 'SUBJECT_MISMATCH'
  | 'INVALID_PAYLOAD'
  | 'UNAVAILABLE'
  | 'FAILED';

export class AdminActionError extends Error {
  readonly code: AdminActionErrorCode;
  constructor(code: AdminActionErrorCode, message: string) {
    super(message);
    this.name = 'AdminActionError';
    this.code = code;
  }
}

const ERROR_MAP: Array<[string, AdminActionErrorCode]> = [
  ['ADMIN_ACTION_UNAUTHENTICATED', 'UNAUTHENTICATED'],
  ['ADMIN_ACTION_FORBIDDEN', 'FORBIDDEN'],
  ['ADMIN_ACTION_UNKNOWN', 'UNKNOWN_ACTION'],
  ['ADMIN_ACTION_NOT_ENABLED', 'NOT_ENABLED'],
  ['ADMIN_ACTION_REASON_REQUIRED', 'REASON_REQUIRED'],
  ['ADMIN_ACTION_REASON_INVALID', 'REASON_INVALID'],
  ['ADMIN_ACTION_SUBJECT_NOT_FOUND', 'SUBJECT_NOT_FOUND'],
  ['ADMIN_ACTION_SUBJECT_MISMATCH', 'SUBJECT_MISMATCH'],
  ['ADMIN_ACTION_INVALID_PAYLOAD', 'INVALID_PAYLOAD'],
  ['ADMIN_ACTION_UNHANDLED', 'FAILED'],
];

/** Human-facing copy in the brand voice: warm, precise, never cute. */
const FRIENDLY: Record<AdminActionErrorCode, string> = {
  UNAUTHENTICATED: 'Sign in to continue.',
  FORBIDDEN: "Your role doesn't allow this action.",
  UNKNOWN_ACTION: 'That action is not recognised.',
  NOT_ENABLED: 'That action is specified but not built yet.',
  REASON_REQUIRED: 'Choose a reason before continuing.',
  REASON_INVALID: "That reason doesn't apply to this action.",
  SUBJECT_NOT_FOUND: "We couldn't find that record.",
  SUBJECT_MISMATCH: 'That action does not apply to this kind of record.',
  INVALID_PAYLOAD: 'Some details were missing or malformed.',
  UNAVAILABLE: 'The admin backend is not configured in this environment.',
  FAILED: "The action didn't complete. Nothing was changed.",
};

function toAdminActionError(err: unknown): AdminActionError {
  const raw =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);

  for (const [prefix, code] of ERROR_MAP) {
    if (raw.includes(prefix)) {
      // Keep the server's detail (e.g. WHY an action is disabled) — it's the useful part.
      const detail = raw.split(`${prefix}:`)[1]?.trim();
      return new AdminActionError(code, detail ? `${FRIENDLY[code]} ${detail}` : FRIENDLY[code]);
    }
  }
  return new AdminActionError('FAILED', FRIENDLY.FAILED);
}

// ---------------------------------------------------------------------------
// Core calls
// ---------------------------------------------------------------------------

export function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

async function callAdminAction(input: AdminActionInput, dryRun: boolean): Promise<unknown> {
  const supabase = tryGetSupabase();
  if (!supabase) {
    // Deliberately loud. A privileged action must never silently no-op into a
    // localStorage store — that is exactly the "demo-ware" failure we're removing.
    throw new AdminActionError('UNAVAILABLE', FRIENDLY.UNAVAILABLE);
  }

  const { data, error } = await supabase.rpc('admin_action', {
    p_action: input.action,
    p_subject_type: input.subjectType,
    p_subject_id: input.subjectId,
    p_reason_code: input.reasonCode ?? null,
    p_note: input.note ?? null,
    p_payload: input.payload ?? {},
    p_idempotency_key: dryRun ? null : (input.idempotencyKey ?? newIdempotencyKey()),
    p_dry_run: dryRun,
  });

  if (error) throw toAdminActionError(error);
  return data;
}

/**
 * Ask what an action WOULD do. Writes nothing.
 *
 * Always call this before showing a confirm dialog — "this suspends 1 host, cancels
 * 4 upcoming bookings worth ₹86,000, notifies 4 guests" is the difference between a
 * considered decision and a click.
 */
export async function previewAdminAction(input: AdminActionInput): Promise<AdminActionPreview> {
  return (await callAdminAction(input, true)) as AdminActionPreview;
}

/** Perform the action. Atomic: state + audit + event, or nothing. */
export async function runAdminAction(input: AdminActionInput): Promise<AdminActionResult> {
  return (await callAdminAction(input, false)) as AdminActionResult;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Invalidate every admin-facing query — the console must never show stale state. */
function invalidateAdminSurfaces(qc: ReturnType<typeof useQueryClient>): void {
  qc.invalidateQueries({
    predicate: (q) => {
      const key = q.queryKey[0];
      return (
        typeof key === 'string' &&
        (key.startsWith('admin') || key === 'listings' || key === 'listing' || key === 'bookings')
      );
    },
  });
}

export function usePreviewAdminAction() {
  return useMutation<AdminActionPreview, AdminActionError, AdminActionInput>({
    mutationFn: previewAdminAction,
  });
}

export function useRunAdminAction() {
  const qc = useQueryClient();
  return useMutation<AdminActionResult, AdminActionError, AdminActionInput>({
    mutationFn: runAdminAction,
    onSuccess: () => invalidateAdminSurfaces(qc),
  });
}

export function useReasonCodes(subjectType?: AdminSubjectType) {
  return useQuery<ReasonCode[]>({
    queryKey: ['admin-reason-codes', subjectType ?? 'all'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      let q = supabase.from('reason_codes').select('*').eq('active', true);
      if (subjectType) q = q.eq('applies_to', subjectType);
      const { data, error } = await q.order('label');
      if (error) return [];
      return (data ?? []) as ReasonCode[];
    },
    staleTime: 5 * 60_000,
  });
}

/** The action registry — drives which buttons render, and why one is disabled. */
export function useAdminActionRegistry() {
  return useQuery<RegisteredAction[]>({
    queryKey: ['admin-action-registry'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase.from('admin_actions_registry').select('*');
      if (error) return [];
      return (data ?? []) as RegisteredAction[];
    },
    staleTime: 5 * 60_000,
  });
}

export function usePendingApprovals() {
  return useQuery<PendingApproval[]>({
    queryKey: ['admin-approvals'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      if (error) return [];
      return (data ?? []) as PendingApproval[];
    },
  });
}

export function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation<
    { status: 'approved' | 'rejected' },
    AdminActionError,
    { approvalId: string; approve: boolean; note?: string }
  >({
    mutationFn: async (v) => {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('decide_approval', {
        p_approval_id: v.approvalId,
        p_approve: v.approve,
        p_note: v.note ?? null,
      });
      if (error) throw toAdminActionError(error);
      return data as { status: 'approved' | 'rejected' };
    },
    onSuccess: (_r, _v) => {
      qc.invalidateQueries({ queryKey: ['admin-approvals'] });
      invalidateAdminSurfaces(qc);
    },
  });
}

// ---------------------------------------------------------------------------
// The audit trail — real, hash-chained, read straight from the log.
// ---------------------------------------------------------------------------

export type AuditEntry = {
  id: string;
  seq: number;
  actor_id: string;
  actor_role: string;
  action: string;
  subject_type: string;
  subject_id: string;
  reason_code: string | null;
  note: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  blast_radius: BlastRadius | null;
  created_at: string;
};

/** Every staff action taken on one record — the fourth tab of every inspector. */
export function useAuditTrail(subjectType: string | undefined, subjectId: string | undefined) {
  return useQuery<AuditEntry[]>({
    queryKey: ['admin-audit-trail', subjectType, subjectId],
    enabled: Boolean(subjectType && subjectId),
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase || !subjectType || !subjectId) return [];
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('subject_type', subjectType)
        .eq('subject_id', subjectId)
        .order('seq', { ascending: false });
      if (error) return [];
      return (data ?? []) as AuditEntry[];
    },
  });
}

/**
 * Nightly integrity check. Returns the rows where the hash chain is broken — i.e.
 * where someone edited history. An empty array is the only acceptable result.
 */
export async function verifyAuditChain(): Promise<
  Array<{ broken_at: number; expected: string; found: string }>
> {
  const supabase = tryGetSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('verify_audit_chain');
  if (error) throw toAdminActionError(error);
  return (data ?? []) as Array<{ broken_at: number; expected: string; found: string }>;
}
