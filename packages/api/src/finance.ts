'use client';

// The money layer. (docs/15-admin-console.md §6, Phase 3)
//
// Revenue is DERIVED from real bookings; costs are ENTERED. Both land in one
// double-entry ledger, so the P&L has a single source and cannot disagree with itself.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';

export type LedgerAccount = {
  code: string;
  name: string;
  kind: 'asset' | 'liability' | 'revenue' | 'expense' | 'equity';
  is_variable: boolean;
  sort_order: number;
};

export type PLLine = {
  code: string;
  name: string;
  kind: string;
  is_variable: boolean;
  actual_cents: number;
  budget_cents: number;
};

export type ProfitAndLoss = {
  from: string;
  to: string;

  /** What guests paid. NOT revenue. */
  gmv: number;
  /** The host's share. Never ours — a pass-through liability. */
  host_payouts: number;
  taxes_collected: number;
  /** Guest fee + host fee. This is what Ryo actually earns. */
  net_revenue: number;

  variable_costs: number;
  /** The line that says whether the business works. */
  contribution_margin: number;
  fixed_costs: number;
  operating_profit: number;

  /** Money we hold but have not earned. A liability, never a balance. */
  escrow_float: number;
  deferred_revenue: number;

  bookings: number;
  arpb: number;
  variable_per_booking: number;
  cm_per_booking: number;
  take_rate_bps: number;

  new_users: number;
  marketing_spend: number;
  blended_cac: number;

  lines: PLLine[];
};

export function useProfitAndLoss(from: string, to: string) {
  return useQuery<ProfitAndLoss | null>({
    queryKey: ['finance-pl', from, to],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return null;
      const { data, error } = await supabase.rpc('finance_pl', { p_from: from, p_to: to });
      if (error) throw new Error(error.message);
      return data as ProfitAndLoss;
    },
  });
}

export function useLedgerAccounts() {
  return useQuery<LedgerAccount[]>({
    queryKey: ['ledger-accounts'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('ledger_accounts')
        .select('*')
        .eq('kind', 'expense')
        .order('sort_order');
      if (error) throw new Error(error.message);
      return (data ?? []) as LedgerAccount[];
    },
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Expenses — the part that is entered by hand
// ---------------------------------------------------------------------------

export type Expense = {
  id: string;
  incurred_on: string;
  account_code: string;
  vendor: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  campaign: string | null;
  recurring_id: string | null;
};

export function useExpenses(from: string, to: string) {
  return useQuery<Expense[]>({
    queryKey: ['expenses', from, to],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('incurred_on', from)
        .lte('incurred_on', to)
        .order('incurred_on', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Expense[];
    },
  });
}

export type NewExpense = {
  incurred_on: string;
  account_code: string;
  vendor?: string;
  description?: string;
  amount_cents: number;
  campaign?: string;
};

/** Inserting an expense posts a balanced journal — the trigger does it, not this. */
export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: NewExpense) => {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getUser();
      const { error } = await supabase.from('expenses').insert({
        incurred_on: e.incurred_on,
        account_code: e.account_code,
        vendor: e.vendor || null,
        description: e.description ?? '',
        amount_cents: e.amount_cents,
        campaign: e.campaign || null,
        entered_by: session.user?.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-pl'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Recurring costs — the feature that makes this usable rather than a receipt drawer.
// Nobody re-enters salaries every month.
// ---------------------------------------------------------------------------

export type RecurringExpense = {
  id: string;
  account_code: string;
  vendor: string | null;
  description: string;
  amount_cents: number;
  day_of_month: number;
  starts_on: string;
  ends_on: string | null;
  active: boolean;
};

export function useRecurringExpenses() {
  return useQuery<RecurringExpense[]>({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const supabase = tryGetSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('account_code');
      if (error) throw new Error(error.message);
      return (data ?? []) as RecurringExpense[];
    },
  });
}

export function useAddRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: {
      account_code: string;
      vendor?: string;
      description?: string;
      amount_cents: number;
      day_of_month?: number;
      starts_on: string;
    }) => {
      const supabase = getSupabase();
      const { error } = await supabase.from('recurring_expenses').insert({
        account_code: r.account_code,
        vendor: r.vendor || null,
        description: r.description ?? '',
        amount_cents: r.amount_cents,
        day_of_month: r.day_of_month ?? 1,
        starts_on: r.starts_on,
      });
      if (error) throw new Error(error.message);
      // Materialise straight away, so the P&L reflects it without waiting for a job.
      const { error: runErr } = await supabase.rpc('run_recurring_expenses');
      if (runErr) throw new Error(runErr.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-pl'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Housekeeping jobs — exposed so an operator can run them, not hidden in a cron
// nobody can see. Both are idempotent.
// ---------------------------------------------------------------------------

export function useRecognizeRevenue() {
  const qc = useQueryClient();
  return useMutation<number, Error, void>({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('recognize_revenue');
      if (error) throw new Error(error.message);
      return (data as number) ?? 0;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-pl'] }),
  });
}

export function useRunRecurring() {
  const qc = useQueryClient();
  return useMutation<number, Error, void>({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('run_recurring_expenses');
      if (error) throw new Error(error.message);
      return (data as number) ?? 0;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-pl'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
