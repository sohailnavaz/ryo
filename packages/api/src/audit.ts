// Real `audit_log` path for privileged staff actions (docs/14 §5, §8).
//
// docs/14 §12 requires the audit log to exist from day 1 so every privileged
// action is captured even before the console is fully built. Until L1 ships the
// table + RLS, the synthetic console keeps its append-only log client-side in
// ./admin-store. This module is the *real* path: when Supabase is wired,
// `recordAudit` writes a real row and `fetchRealAudit` reads them back.
//
// Dual-path contract (so reads never double-count):
//   • Supabase wired  → recordAudit writes the real row; useAdminAudit reads
//     real rows. (admin-store still logs locally but those are ignored in real
//     mode.)
//   • not wired (demo) → recordAudit is a no-op; admin-store's local log is the
//     source, merged with the seed in useAdminAudit.

import { tryGetSupabase } from './client';
import type { AdminAuditEntry } from './admin';

export type AuditInput = {
  action: string;
  target: string;
  reason_code: string;
  note?: string;
  /** Human label for the actor when there's no signed-in staff id (demo). */
  actor_label?: string;
};

/** True when audit writes/reads should hit the real table. */
export function auditIsLive(): boolean {
  return tryGetSupabase() !== null;
}

/** A resolved real staff identity (role 'staff' | 'admin') with a live session. */
export type StaffActor = {
  id: string;
  /** Human label for audit rows (email, else id). */
  label: string;
  role: 'staff' | 'admin';
};

/**
 * Resolve the current *real* staff session, or null.
 *
 * Returns a StaffActor only when (a) Supabase is wired, (b) a real Supabase
 * auth user exists, and (c) that user's `profiles.role` is 'staff' or 'admin'.
 * The client-side DEMO admin (demo-auth.ts) has no real Supabase session, so
 * this returns null for it — callers then fall back to the admin-store layer so
 * the demo console keeps working. Never throws.
 */
export async function resolveStaffActor(): Promise<StaffActor | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;
  try {
    const { data: auth } = await sb.auth.getUser();
    const user = auth.user;
    if (!user) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    const role = (data as { role?: string }).role;
    if (role !== 'staff' && role !== 'admin') return null;
    return { id: user.id, label: user.email ?? user.id, role };
  } catch {
    return null;
  }
}

/**
 * Best-effort real audit write. No-op (resolves) when Supabase isn't wired —
 * the local console log in ./admin-store covers the demo. Never throws: an
 * audit failure must not block the privileged action it records (the action's
 * own write already succeeded by the time we get here).
 */
export async function recordAudit(entry: AuditInput): Promise<void> {
  const sb = tryGetSupabase();
  if (!sb) return;
  try {
    const { data: auth } = await sb.auth.getUser();
    await sb.from('audit_log').insert({
      actor_id: auth.user?.id ?? null,
      actor_label: entry.actor_label ?? auth.user?.email ?? 'staff',
      action: entry.action,
      target: entry.target,
      reason_code: entry.reason_code,
      note: entry.note ?? null,
    });
  } catch {
    // best-effort — the action itself is the source of truth.
  }
}

export async function fetchRealAudit(filter: {
  actor?: string;
  action?: string;
}): Promise<AdminAuditEntry[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  let q = sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
  if (filter.action) q = q.ilike('action', `%${filter.action}%`);
  const { data, error } = await q;
  if (error) return [];
  let rows = (data ?? []).map((r) => ({
    id: String(r.id),
    actor: String(r.actor_label ?? r.actor_id ?? 'staff'),
    action: String(r.action ?? ''),
    target: String(r.target ?? ''),
    reason_code: String(r.reason_code ?? ''),
    created_at: String(r.created_at ?? ''),
  }));
  if (filter.actor) {
    const a = filter.actor.toLowerCase();
    rows = rows.filter((r) => r.actor.toLowerCase().includes(a));
  }
  return rows;
}
