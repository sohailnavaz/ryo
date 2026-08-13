-- 0021_lock_finance_config.sql — lock down ledger_accounts + platform_config.
--
-- Audit finding (my own, from 0018): these two reference tables were left with RLS off,
-- and main's default grants gave `anon` SELECT and `authenticated` full write. So the
-- chart of accounts + the platform take-rate were world-readable, and any signed-in
-- guest could DELETE/UPDATE them (e.g. rewrite platform_config to a 0% fee). Reference
-- data, but staff-only; writes belong in migrations, not the API.

alter table public.ledger_accounts enable row level security;
alter table public.platform_config enable row level security;

drop policy if exists "ledger_accounts staff read" on public.ledger_accounts;
create policy "ledger_accounts staff read" on public.ledger_accounts for select using (public.is_staff());

drop policy if exists "platform_config staff read" on public.platform_config;
create policy "platform_config staff read" on public.platform_config for select using (public.is_staff());

-- No API writes at all; no anon anything.
revoke all on public.ledger_accounts from anon, authenticated;
revoke all on public.platform_config from anon, authenticated;
grant select on public.ledger_accounts to authenticated;   -- RLS still narrows to staff
grant select on public.platform_config to authenticated;
