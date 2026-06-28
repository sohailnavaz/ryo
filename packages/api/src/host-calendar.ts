// Host calendar — graduating the localStorage override store to a real table.
//
// `./host-calendar-store.ts` is the client-side (localStorage) fallback that the
// host calendar shipped with (v2-preview). This module adds the REAL backend:
// per-day block / re-open + nightly-price overrides persisted in a
// `public.listing_calendar` table, scoped to the signed-in host via RLS.
//
// Until L1 lands the migration (see spec below), `fetchRemoteOverrides` detects
// the missing relation and returns `null`, so the unified `useHostCalendarStore`
// hook transparently falls back to localStorage. The moment the table exists,
// the same code path upgrades to real persistence with NO further changes —
// the screen already calls the unified hook.
//
// ── REQUESTED FROM L1 (schema steward — do NOT write this migration in L3) ──
//   create table if not exists public.listing_calendar (
//     listing_id  uuid not null references public.listings(id) on delete cascade,
//     date        date not null,
//     blocked     boolean,            -- null = no manual availability override
//     price_cents integer check (price_cents is null or price_cents >= 0),
//     updated_at  timestamptz not null default now(),
//     primary key (listing_id, date)
//   );
//   alter table public.listing_calendar enable row level security;
//   -- A host may read/write calendar rows only for listings they own:
//   create policy "listing_calendar host rw own"
//     on public.listing_calendar for all
//     using   (exists (select 1 from public.listings l
//                       where l.id = listing_id and l.host_id = auth.uid()))
//     with check (exists (select 1 from public.listings l
//                       where l.id = listing_id and l.host_id = auth.uid()));

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';
import {
  dayKey,
  setDayBlocked as setLocalBlocked,
  setDayPrice as setLocalPrice,
  useHostCalendarOverrides,
  type HostCalendarOverrides,
} from './host-calendar-store';

export const LISTING_CALENDAR_TABLE = 'listing_calendar';

type CalRow = {
  listing_id: string;
  date: string;
  blocked: boolean | null;
  price_cents: number | null;
};

function rowsToOverrides(rows: CalRow[]): HostCalendarOverrides {
  const blocked: Record<string, boolean> = {};
  const priceCents: Record<string, number> = {};
  for (const r of rows) {
    const k = dayKey(r.listing_id, r.date);
    if (r.blocked !== null && r.blocked !== undefined) blocked[k] = r.blocked;
    if (r.price_cents !== null && r.price_cents !== undefined) priceCents[k] = r.price_cents;
  }
  return { blocked, priceCents };
}

/** PostgREST "relation does not exist" — the table hasn't been migrated yet
 *  (L1 pending). When we see this we transparently fall back to localStorage. */
function isMissingTableError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e?.code === '42P01' || /does not exist|could not find the table/i.test(e?.message ?? '');
}

/**
 * Read the host's real calendar overrides for the given listings.
 * Returns `null` when there is no remote backend to read from — i.e. Supabase
 * isn't configured, nobody is signed in, or the table doesn't exist yet — so
 * the caller falls back to the localStorage store.
 */
export async function fetchRemoteOverrides(
  listingIds: string[],
): Promise<HostCalendarOverrides | null> {
  const supabase = tryGetSupabase();
  if (!supabase || listingIds.length === 0) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Demo identities have no real listings to scope calendar rows to → fall back
  // to the localStorage override store.
  if ((user.app_metadata as { demo?: boolean } | undefined)?.demo === true) return null;

  const { data, error } = await supabase
    .from(LISTING_CALENDAR_TABLE)
    .select('listing_id, date, blocked, price_cents')
    .in('listing_id', listingIds);
  if (error) {
    if (isMissingTableError(error)) return null; // not migrated yet → localStorage fallback
    throw error;
  }
  return rowsToOverrides((data ?? []) as CalRow[]);
}

async function upsertRemoteDay(
  listingId: string,
  date: string,
  patch: { blocked?: boolean | null; price_cents?: number | null },
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(LISTING_CALENDAR_TABLE)
    .upsert({ listing_id: listingId, date, ...patch }, { onConflict: 'listing_id,date' });
  if (error) throw error;
}

export type HostCalendarStore = {
  /** Effective overrides (real table when signed in + migrated, else localStorage). */
  overrides: HostCalendarOverrides;
  /** True when reads/writes hit the real `listing_calendar` table. */
  isRemote: boolean;
  /** Block (true) / re-open (false) a day. `null` clears the override. */
  setBlocked: (listingId: string, date: string, blocked: boolean | null) => void | Promise<void>;
  /** Set a per-day nightly price in cents. `null` clears it. */
  setPrice: (listingId: string, date: string, priceCents: number | null) => void | Promise<void>;
};

/**
 * Unified host-calendar store. Prefers the real `listing_calendar` table for a
 * signed-in host; falls back to the localStorage store otherwise (and until the
 * table is migrated). The host calendar screen uses this single hook, so it
 * upgrades to real persistence automatically once L1 ships the migration.
 */
export function useHostCalendarStore(listingIds: string[]): HostCalendarStore {
  const qc = useQueryClient();
  const local = useHostCalendarOverrides();

  const sortedIds = [...listingIds].sort();
  const remote = useQuery({
    queryKey: ['listing-calendar', sortedIds],
    queryFn: () => fetchRemoteOverrides(listingIds),
    enabled: listingIds.length > 0,
    staleTime: 30_000,
  });

  // remote.data === null → no remote backend; undefined → still loading.
  const isRemote = remote.data != null;
  const overrides = isRemote ? (remote.data as HostCalendarOverrides) : local;

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ['listing-calendar'] }),
    [qc],
  );

  const setBlocked = useCallback(
    async (listingId: string, date: string, blocked: boolean | null) => {
      if (!isRemote) return setLocalBlocked(listingId, date, blocked);
      await upsertRemoteDay(listingId, date, { blocked });
      await invalidate();
    },
    [isRemote, invalidate],
  );

  const setPrice = useCallback(
    async (listingId: string, date: string, priceCents: number | null) => {
      if (!isRemote) return setLocalPrice(listingId, date, priceCents);
      await upsertRemoteDay(listingId, date, { price_cents: priceCents });
      await invalidate();
    },
    [isRemote, invalidate],
  );

  return { overrides, isRemote, setBlocked, setPrice };
}

/** Imperative remote mutation hook (e.g. for bulk edits). UI prefers `useHostCalendarStore`. */
export function useSetListingCalendarDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      listingId: string;
      date: string;
      blocked?: boolean | null;
      price_cents?: number | null;
    }) => upsertRemoteDay(input.listingId, input.date, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing-calendar'] }),
  });
}
