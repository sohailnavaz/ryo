'use client';

// Real console reads. (docs/15-admin-console.md §10, Phase 2)
//
// These replace the synthetic + localStorage-override hooks in `admin.ts` for the
// surfaces that now have real tables behind them. Every write goes through
// `admin_action()` (see admin-action.ts) — there are no mutations in this file, on
// purpose: a read module that can also write is how a second write path is born.
//
// `admin.ts` still serves the aggregate dashboards (overview, finance) from synthetic
// data. That is honest — there is no revenue ledger yet (Phase 3) — and those screens
// still carry the preview banner.

import { useQuery } from '@tanstack/react-query';
import { tryGetSupabase } from './client';
import type { BlastRadius } from './admin-action';

// ---------------------------------------------------------------------------
// User inspector
// ---------------------------------------------------------------------------

export type AdminUserBooking = {
  id: string;
  listing_title: string;
  start_date: string;
  end_date: string;
  status: string;
  total_cents: number;
  currency: string;
};

export type AdminUserListing = {
  id: string;
  title: string;
  city: string;
  moderation_status: string;
  price_cents: number;
};

export type AdminUserIncident = {
  id: string;
  subject: string;
  status: string;
  tier: number;
  created_at: string;
};

export type AdminAuditRow = {
  id: string;
  seq: number;
  action: string;
  actor_name: string;
  actor_role: string;
  subject_type?: string;
  subject_id?: string;
  reason_code: string | null;
  note: string | null;
  blast_radius?: BlastRadius | null;
  created_at: string;
};

export type AdminUserFull = {
  id: string;
  display_name: string;
  email: string;
  email_masked: boolean;
  role: 'guest' | 'host' | 'staff' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  last_sign_in_at: string | null;
  bookings_count: number;
  ltv_cents: number;
  nights: number;
  listings_count: number;
  bookings: AdminUserBooking[];
  listings: AdminUserListing[];
  incidents: AdminUserIncident[];
  audit_trail: AdminAuditRow[];
};

/**
 * The real user inspector.
 *
 * Phase 1 made `/admin/users` serve real uuids while the inspector was still looking
 * them up in a synthetic seed — so every row in the new list landed on "User not
 * found". This closes that seam.
 */
export function useAdminUserFull(userId: string | undefined, unmask = false) {
  return useQuery<AdminUserFull | null>({
    queryKey: ['admin-user-full', userId, unmask],
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase || !userId) return null;
      const { data, error } = await supabase.rpc('admin_get_user', {
        p_id: userId,
        p_unmask: unmask,
      });
      if (error) throw new Error(error.message);
      return (data as AdminUserFull | null) ?? null;
    },
  });
}

// ---------------------------------------------------------------------------
// Moderation queue
// ---------------------------------------------------------------------------

export type ModerationListing = {
  id: string;
  title: string;
  city: string;
  country: string;
  moderation_status: 'pending' | 'changes_requested' | 'rejected';
  moderation_note: string | null;
  price_cents: number;
  currency: string;
  host_name: string;
  host_id: string;
  created_at: string;
};

export type ModerationReview = {
  id: string;
  body: string;
  rating: number;
  status: 'visible' | 'removed';
  listing_title: string;
  listing_id: string;
  author: string;
  created_at: string;
};

export function useModerationQueue() {
  return useQuery<{ listings: ModerationListing[]; reviews: ModerationReview[] }>({
    queryKey: ['admin-moderation-queue'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return { listings: [], reviews: [] };
      const { data, error } = await supabase.rpc('admin_moderation_queue');
      if (error) throw new Error(error.message);
      return data as { listings: ModerationListing[]; reviews: ModerationReview[] };
    },
  });
}

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export type FeatureFlag = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  is_emergency: boolean;
  updated_at: string;
  updated_by: string | null;
};

export function useFeatureFlags() {
  return useQuery<FeatureFlag[]>({
    queryKey: ['admin-feature-flags'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('is_emergency')
        .order('key');
      if (error) throw new Error(error.message);
      return (data ?? []) as FeatureFlag[];
    },
  });
}

// ---------------------------------------------------------------------------
// Audit log — the real, hash-chained one
// ---------------------------------------------------------------------------

export function useRealAuditLog(limit = 100, action?: string) {
  return useQuery<AdminAuditRow[]>({
    queryKey: ['admin-audit-real', limit, action ?? 'all'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase.rpc('admin_list_audit', {
        p_limit: limit,
        p_action: action ?? null,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as AdminAuditRow[];
    },
  });
}
