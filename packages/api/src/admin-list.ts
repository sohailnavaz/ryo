'use client';

// Server-driven lists for the admin console. (docs/15-admin-console.md §3)
//
// There is no client-side filtering, sorting or pagination anywhere in here — and
// there must never be. The old screen fetched every user and filtered in memory;
// this fetches one page of ≤200 rows and lets Postgres do the work.
//
// Pagination is KEYSET, not offset. An offset walks every skipped row and — worse —
// silently drops or repeats records when the data mutates between pages, which in a
// live ops console it constantly does.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Opaque page boundary: the last row's sort value + its id. Never construct by hand. */
export type ListCursor = { v: unknown; id: string };

export type AdminUserRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: 'guest' | 'host' | 'staff' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  /** Masked (`g•••@ryo.test`) unless an admin explicitly unmasked. */
  email: string;
  email_masked: boolean;
  last_sign_in_at: string | null;
  bookings_count: number;
  ltv_cents: number;
  nights: number;
  listings_count: number;
  host_bookings: number;
  cursor: ListCursor;
};

/** Counts per facet value. A filter rail without counts makes the operator guess. */
export type Facets = {
  status: Record<string, number>;
  role: Record<string, number>;
};

export type AdminListPage<T> = {
  rows: T[];
  facets: Facets;
  total: number;
  /** True when `total` is a planner estimate rather than an exact count. */
  total_is_estimate: boolean;
  has_more: boolean;
};

export type UserSegment =
  | 'all'
  | 'suspended'
  | 'suspended_recent'
  | 'staff'
  | 'hosts'
  | 'new_signups_7d'
  | 'hosts_no_bookings_30d'
  | 'top_value';

export type UserSortField =
  | 'created_at'
  | 'suspended_at'
  | 'last_sign_in_at'
  | 'ltv_cents'
  | 'bookings_count'
  | 'listings_count'
  | 'display_name';

export type AdminUserListParams = {
  segment?: UserSegment;
  q?: string;
  filters?: { role?: string[]; status?: string[] };
  sort?: UserSortField;
  dir?: 'asc' | 'desc';
  limit?: number;
  /** Admin-only, and recorded as a `pii.unmasked` event. Never on by default. */
  unmask?: boolean;
};

const EMPTY_PAGE: AdminListPage<AdminUserRow> = {
  rows: [],
  facets: { status: {}, role: {} },
  total: 0,
  total_is_estimate: false,
  has_more: false,
};

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------

export function useAdminUserList(params: AdminUserListParams = {}) {
  const {
    segment = 'all',
    q = '',
    filters = {},
    sort = 'created_at',
    dir = 'desc',
    limit = 50,
    unmask = false,
  } = params;

  return useInfiniteQuery<
    AdminListPage<AdminUserRow>,
    Error,
    InfiniteData<AdminListPage<AdminUserRow>>,
    unknown[],
    ListCursor | null
  >({
    queryKey: ['admin-list', 'users', segment, q, filters, sort, dir, limit, unmask],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const supabase = tryGetSupabase();
      if (!supabase) return EMPTY_PAGE;

      const { data, error } = await supabase.rpc('admin_list_users', {
        p_segment: segment,
        p_q: q.trim() || null,
        p_filters: filters,
        p_sort: sort,
        p_dir: dir,
        p_cursor: pageParam ?? null,
        p_limit: limit,
        p_unmask: unmask,
      });

      if (error) throw new Error(error.message);
      return data as AdminListPage<AdminUserRow>;
    },
    getNextPageParam: (last) => {
      if (!last.has_more) return undefined;
      const tail = last.rows[last.rows.length - 1];
      return tail ? tail.cursor : undefined;
    },
    staleTime: 15_000,
  });
}

/** Flatten the infinite-query pages into the shape a table wants. */
export function flattenList<T>(
  pages: Array<AdminListPage<T>> | undefined,
): { rows: T[]; facets: Facets; total: number; totalIsEstimate: boolean } {
  const first = pages?.[0];
  if (!pages || !first) {
    return { rows: [], facets: { status: {}, role: {} }, total: 0, totalIsEstimate: false };
  }
  return {
    rows: pages.flatMap((p) => p.rows),
    // Facets and totals describe the whole result set, not the pages fetched so far,
    // so they come from the first page rather than being recomputed as we scroll.
    facets: first.facets,
    total: first.total,
    totalIsEstimate: first.total_is_estimate,
  };
}

// ---------------------------------------------------------------------------
// Saved views — the front door. "All rows" is the escape hatch, not the default.
// ---------------------------------------------------------------------------

export type AdminView = {
  id: string;
  resource: string;
  key: string;
  name: string;
  description: string;
  definition: { segment?: UserSegment; sort?: UserSortField; filters?: Record<string, string[]> };
  is_system: boolean;
  is_shared: boolean;
  sort_order: number;
};

export function useAdminViews(resource: string) {
  return useQuery<AdminView[]>({
    queryKey: ['admin-views', resource],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('admin_views')
        .select('*')
        .eq('resource', resource)
        .order('sort_order');
      if (error) return [];
      return (data ?? []) as AdminView[];
    },
    staleTime: 60_000,
  });
}

export function useSaveAdminView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      resource: string;
      key: string;
      name: string;
      description?: string;
      definition: AdminView['definition'];
      isShared?: boolean;
    }) => {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getUser();
      const { error } = await supabase.from('admin_views').insert({
        resource: v.resource,
        key: v.key,
        name: v.name,
        description: v.description ?? '',
        definition: v.definition,
        owner_id: session.user?.id,
        is_shared: v.isShared ?? false,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: ['admin-views', v.resource] }),
  });
}

export function useDeleteAdminView(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.from('admin_views').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-views', resource] }),
  });
}

// ---------------------------------------------------------------------------
// ⌘K — the primary navigation. Operators paste an id; they do not scroll.
// ---------------------------------------------------------------------------

export type OmniboxHit = {
  kind: 'user' | 'listing' | 'booking';
  id: string;
  label: string;
  sublabel: string;
  href: string;
};

export function useAdminOmnibox(q: string) {
  const query = q.trim();
  return useQuery<OmniboxHit[]>({
    queryKey: ['admin-omnibox', query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase.rpc('admin_omnibox', { p_q: query, p_limit: 8 });
      if (error) return [];
      return (data ?? []) as OmniboxHit[];
    },
    staleTime: 10_000,
  });
}
