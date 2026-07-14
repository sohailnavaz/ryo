-- 0010_ledger_finance.sql — Phase 3 (docs/15-admin-console.md §6).
--
-- The money layer. Revenue is DERIVED from real bookings; costs are ENTERED
-- (marketing, host share, salaries, infra) — decision D2.
--
-- Built on a double-entry ledger, and built NOW, before real payments, because
-- retrofitting double-entry onto a live payments system is one of the genuinely
-- miserable jobs in software: the moment partial refunds and host cancellations
-- exist, a `bookings.total_cents` column silently drifts from reality and nobody
-- can say by how much.
--
-- Three rules the whole thing hangs on (docs/15 §6.1):
--
--   1. GMV IS NOT REVENUE. What a guest pays is not what Ryo earns.
--   2. THE HOST'S SHARE IS NOT OURS. It is a pass-through liability from the moment
--      we take the money.
--   3. ESCROW IS A LIABILITY, NOT A BALANCE. Cash we hold but have not earned must
--      never be summed into any revenue figure.
--
-- Expenses are posted to the SAME ledger, not kept in a parallel list — so the P&L
-- has exactly one source and cannot disagree with itself.

-- ---------------------------------------------------------------------------
-- 1. Chart of accounts
-- ---------------------------------------------------------------------------

create table if not exists public.ledger_accounts (
  code        text primary key,
  name        text not null,
  kind        text not null check (kind in ('asset', 'liability', 'revenue', 'expense', 'equity')),
  -- Does this cost scale with bookings? The variable/fixed split is what produces
  -- contribution margin, which is the number that says whether the business works.
  is_variable boolean not null default false,
  sort_order  int not null default 100
);

insert into public.ledger_accounts (code, name, kind, is_variable, sort_order) values
  -- assets
  ('1000', 'Cash',                     'asset',     false, 10),
  ('1100', 'Escrow held',              'asset',     false, 20),
  -- liabilities
  ('2000', 'Host payable',             'liability', false, 30),
  ('2200', 'Deferred revenue',         'liability', false, 40),
  ('2300', 'Taxes payable',            'liability', false, 50),
  -- revenue
  ('4000', 'Guest service fee',        'revenue',   false, 60),
  ('4100', 'Host service fee',         'revenue',   false, 70),
  -- variable cost (scales with bookings)
  ('5000', 'Payment processing',       'expense',   true,  80),
  ('5100', 'FX & payout fees',         'expense',   true,  90),
  ('5200', 'Refunds & goodwill',       'expense',   true,  100),
  ('5300', 'Stay-Guarantee claims',    'expense',   true,  110),
  ('5400', 'Concierge (human + AI)',   'expense',   true,  120),
  -- fixed cost (opex)
  ('6000', 'Salaries & contractors',   'expense',   false, 130),
  ('6100', 'Marketing',                'expense',   false, 140),
  ('6200', 'Infrastructure & tooling', 'expense',   false, 150),
  ('6300', 'Legal & compliance',       'expense',   false, 160),
  ('6400', 'Other operating',          'expense',   false, 170)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 2. The ledger. Append-only, and every journal must balance to zero.
-- ---------------------------------------------------------------------------

create table if not exists public.ledger_entries (
  id           bigserial primary key,
  journal_id   uuid not null,
  occurred_on  date not null,
  account_code text not null references public.ledger_accounts(code),
  debit_cents  bigint not null default 0 check (debit_cents  >= 0),
  credit_cents bigint not null default 0 check (credit_cents >= 0),
  currency     text not null default 'INR',
  memo         text,
  ref_type     text,          -- 'booking' | 'expense' | 'refund'
  ref_id       text,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  -- A line is a debit OR a credit. Never both, never neither.
  constraint one_sided check ((debit_cents > 0) <> (credit_cents > 0))
);

create index if not exists ledger_journal_idx on public.ledger_entries (journal_id);
create index if not exists ledger_account_idx on public.ledger_entries (account_code, occurred_on);
create index if not exists ledger_ref_idx     on public.ledger_entries (ref_type, ref_id);

alter table public.ledger_entries enable row level security;

drop policy if exists "ledger staff read" on public.ledger_entries;
create policy "ledger staff read" on public.ledger_entries for select using (public.is_staff());

-- The ledger is history. It is never edited — a mistake is corrected by posting a
-- reversing journal, which is what leaves an honest trail.
create or replace function public.ledger_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'LEDGER_IMMUTABLE: post a reversing journal instead of editing history'
    using errcode = '42501';
end;
$$;

drop trigger if exists ledger_immutable_trg on public.ledger_entries;
create trigger ledger_immutable_trg
  before update or delete on public.ledger_entries
  for each row execute function public.ledger_immutable();

-- The ONLY way to write to the ledger. Refuses anything that does not balance.
create or replace function public.post_journal(
  p_lines       jsonb,        -- [{account, debit_cents?, credit_cents?}, …]
  p_occurred_on date,
  p_memo        text default null,
  p_ref_type    text default null,
  p_ref_id      text default null,
  p_currency    text default 'INR'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_journal uuid := gen_random_uuid();
  v_line    jsonb;
  v_debits  bigint := 0;
  v_credits bigint := 0;
  v_actor   uuid := auth.uid();
begin
  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_debits  := v_debits  + coalesce((v_line->>'debit_cents')::bigint, 0);
    v_credits := v_credits + coalesce((v_line->>'credit_cents')::bigint, 0);
  end loop;

  if v_debits <> v_credits then
    raise exception 'JOURNAL_UNBALANCED: debits % ≠ credits %', v_debits, v_credits
      using errcode = '22023';
  end if;
  if v_debits = 0 then
    raise exception 'JOURNAL_EMPTY: a journal must move money' using errcode = '22023';
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    -- Skip empty lines. A booking with no taxes must not post a 0/0 line, which is
    -- neither a debit nor a credit and would (correctly) fail the one_sided check.
    continue when coalesce((v_line->>'debit_cents')::bigint, 0) = 0
             and  coalesce((v_line->>'credit_cents')::bigint, 0) = 0;

    insert into ledger_entries (
      journal_id, occurred_on, account_code, debit_cents, credit_cents,
      currency, memo, ref_type, ref_id, created_by
    ) values (
      v_journal, p_occurred_on, v_line->>'account',
      coalesce((v_line->>'debit_cents')::bigint, 0),
      coalesce((v_line->>'credit_cents')::bigint, 0),
      p_currency, p_memo, p_ref_type, p_ref_id, v_actor
    );
  end loop;

  return v_journal;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Platform fee config — the take rate lives as data, not as a magic number
--    scattered through the code. (docs/06 §3: ~14–16% blended.)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_config (
  key   text primary key,
  value bigint not null,
  note  text
);

insert into public.platform_config (key, value, note) values
  ('host_fee_bps',        300, 'Host service fee, basis points of (subtotal + cleaning). 300 = 3%'),
  ('processing_fee_bps',  250, 'Modelled payment-processing cost, bps of total. Real figure lands with real payments.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Booking → ledger.
--
-- On confirm (money captured into escrow):
--     Dr Escrow held            total
--        Cr Host payable        host share      ← never ours
--        Cr Taxes payable       taxes           ← never ours
--        Cr Deferred revenue    our fees        ← not YET ours
--
-- Revenue is recognised at CHECK-IN, not at booking (docs/15 §6.2): a booking made
-- in March for a June stay earns nothing in March, and a cancelled one never earns
-- anything at all.
-- ---------------------------------------------------------------------------

create or replace function public.booking_fee_split(p_booking bookings)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_host_bps  bigint := (select value from platform_config where key = 'host_fee_bps');
  v_subtotal  bigint := coalesce(p_booking.subtotal_cents, p_booking.total_cents);
  v_cleaning  bigint := coalesce(p_booking.cleaning_fee_cents, 0);
  v_guest_fee bigint := coalesce(p_booking.service_fee_cents, 0);
  v_taxes     bigint := coalesce(p_booking.taxes_cents, 0);
  v_discount  bigint := coalesce(p_booking.discount_cents, 0);
  v_base      bigint;
  v_host_fee  bigint;
  v_host_pay  bigint;
begin
  v_base     := greatest(v_subtotal + v_cleaning - v_discount, 0);
  v_host_fee := (v_base * v_host_bps) / 10000;
  v_host_pay := v_base - v_host_fee;

  return jsonb_build_object(
    'total',        p_booking.total_cents,
    'host_payout',  v_host_pay,
    'host_fee',     v_host_fee,
    'guest_fee',    v_guest_fee,
    'taxes',        v_taxes,
    'our_fees',     v_host_fee + v_guest_fee,
    -- Anything the stored total doesn't account for lands on the host payout, so the
    -- journal always balances against what the guest ACTUALLY paid. Never invent a
    -- number to make the books close.
    'plug',         p_booking.total_cents - (v_host_pay + v_host_fee + v_guest_fee + v_taxes)
  );
end;
$$;

create or replace function public.post_booking_capture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s          jsonb;
  v_host_pay bigint;
begin
  if new.status <> 'confirmed' then return new; end if;
  if exists (select 1 from ledger_entries where ref_type = 'booking' and ref_id = new.id::text) then
    return new;
  end if;

  s := booking_fee_split(new);
  v_host_pay := (s->>'host_payout')::bigint + (s->>'plug')::bigint;

  perform post_journal(
    jsonb_build_array(
      jsonb_build_object('account', '1100', 'debit_cents',  new.total_cents),
      jsonb_build_object('account', '2000', 'credit_cents', v_host_pay),
      jsonb_build_object('account', '2300', 'credit_cents', (s->>'taxes')::bigint),
      jsonb_build_object('account', '2200', 'credit_cents', (s->>'our_fees')::bigint)
    ),
    -- Dated when the money MOVES (booking), not at check-in. Escrow is taken the
    -- moment the guest pays. Dating it at start_date meant a FUTURE booking's capture
    -- fell outside an as-of-today balance while its cancellation reversal (dated
    -- today) fell inside — producing a NEGATIVE deferred-revenue liability, which is
    -- arithmetic nonsense. Caught by reading the number on the rendered P&L.
    new.created_at::date, 'Booking captured into escrow', 'booking', new.id::text
  );
  return new;
end;
$$;

-- Cancelling reverses the capture. The money was never earned.
create or replace function public.post_booking_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s          jsonb;
  v_host_pay bigint;
begin
  if new.status <> 'cancelled' or old.status = 'cancelled' then return new; end if;
  if not exists (select 1 from ledger_entries where ref_type = 'booking' and ref_id = new.id::text) then
    return new;
  end if;
  if exists (select 1 from ledger_entries where ref_type = 'booking_reversal' and ref_id = new.id::text) then
    return new;
  end if;

  s := booking_fee_split(new);
  v_host_pay := (s->>'host_payout')::bigint + (s->>'plug')::bigint;

  perform post_journal(
    jsonb_build_array(
      jsonb_build_object('account', '2000', 'debit_cents',  v_host_pay),
      jsonb_build_object('account', '2300', 'debit_cents',  (s->>'taxes')::bigint),
      jsonb_build_object('account', '2200', 'debit_cents',  (s->>'our_fees')::bigint),
      jsonb_build_object('account', '1100', 'credit_cents', new.total_cents)
    ),
    current_date, 'Booking cancelled — capture reversed', 'booking_reversal', new.id::text
  );
  return new;
end;
$$;

drop trigger if exists booking_capture_trg on public.bookings;
create trigger booking_capture_trg
  after insert on public.bookings
  for each row execute function public.post_booking_capture();

drop trigger if exists booking_cancel_trg on public.bookings;
create trigger booking_cancel_trg
  after update of status on public.bookings
  for each row execute function public.post_booking_cancel();

-- Recognise revenue for every stay that has started and hasn't been recognised yet.
-- Idempotent: safe to run on a schedule, or by hand from the console.
create or replace function public.recognize_revenue()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r       bookings%rowtype;   -- not `record`: booking_fee_split() takes a bookings row
  s       jsonb;
  v_count int := 0;
begin
  for r in
    select b.* from bookings b
     where b.status = 'confirmed'
       and b.start_date <= current_date
       and not exists (
         select 1 from ledger_entries
          where ref_type = 'recognition' and ref_id = b.id::text
       )
  loop
    s := booking_fee_split(r);
    if (s->>'our_fees')::bigint > 0 then
      perform post_journal(
        jsonb_build_array(
          jsonb_build_object('account', '2200', 'debit_cents',  (s->>'our_fees')::bigint),
          jsonb_build_object('account', '4000', 'credit_cents', (s->>'guest_fee')::bigint),
          jsonb_build_object('account', '4100', 'credit_cents', (s->>'host_fee')::bigint)
        ),
        r.start_date, 'Revenue recognised at check-in', 'recognition', r.id::text
      );
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.recognize_revenue() from public, anon;
grant execute on function public.recognize_revenue() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Expenditure — the part that is ENTERED (decision D2)
-- ---------------------------------------------------------------------------

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  incurred_on   date not null,
  account_code  text not null references public.ledger_accounts(code),
  vendor        text,
  description   text not null default '',
  amount_cents  bigint not null check (amount_cents > 0),
  currency      text not null default 'INR',
  market        text,
  campaign      text,          -- joins marketing spend → CAC
  receipt_url   text,
  recurring_id  uuid,
  entered_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create index if not exists expenses_period_idx on public.expenses (incurred_on, account_code);

alter table public.expenses enable row level security;

drop policy if exists "expenses staff read"   on public.expenses;
create policy "expenses staff read"   on public.expenses for select using (public.is_staff());
drop policy if exists "expenses staff insert" on public.expenses;
create policy "expenses staff insert" on public.expenses for insert with check (public.is_staff());

-- Every expense posts to the ledger. No parallel list — one source of truth, so the
-- P&L cannot disagree with itself.
create or replace function public.post_expense()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform post_journal(
    jsonb_build_array(
      jsonb_build_object('account', new.account_code, 'debit_cents',  new.amount_cents),
      jsonb_build_object('account', '1000',           'credit_cents', new.amount_cents)
    ),
    new.incurred_on,
    coalesce(nullif(new.description, ''), new.vendor, 'Expense'),
    'expense', new.id::text, new.currency
  );
  return new;
end;
$$;

drop trigger if exists expense_post_trg on public.expenses;
create trigger expense_post_trg
  after insert on public.expenses
  for each row execute function public.post_expense();

-- Recurring costs. Nobody re-enters salaries every month — this is the feature that
-- makes the expenditure page usable rather than a receipt drawer.
create table if not exists public.recurring_expenses (
  id            uuid primary key default gen_random_uuid(),
  account_code  text not null references public.ledger_accounts(code),
  vendor        text,
  description   text not null default '',
  amount_cents  bigint not null check (amount_cents > 0),
  currency      text not null default 'INR',
  day_of_month  int not null default 1 check (day_of_month between 1 and 28),
  starts_on     date not null,
  ends_on       date,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.recurring_expenses enable row level security;
drop policy if exists "recurring staff all" on public.recurring_expenses;
create policy "recurring staff all" on public.recurring_expenses for all
  using (public.is_staff()) with check (public.is_staff());

/** Materialise recurring costs into real expenses up to today. Idempotent. */
create or replace function public.run_recurring_expenses()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r       record;
  d       date;
  v_count int := 0;
begin
  for r in select * from recurring_expenses where active loop
    d := date_trunc('month', greatest(r.starts_on, current_date - interval '12 months'))::date;
    while d <= current_date loop
      d := (date_trunc('month', d) + (r.day_of_month - 1) * interval '1 day')::date;
      exit when d > current_date or (r.ends_on is not null and d > r.ends_on);

      if d >= r.starts_on and not exists (
        select 1 from expenses
         where recurring_id = r.id and incurred_on = d
      ) then
        insert into expenses (incurred_on, account_code, vendor, description,
                              amount_cents, currency, recurring_id)
        values (d, r.account_code, r.vendor, r.description, r.amount_cents, r.currency, r.id);
        v_count := v_count + 1;
      end if;

      d := (date_trunc('month', d) + interval '1 month')::date;
    end loop;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.run_recurring_expenses() from public, anon;
grant execute on function public.run_recurring_expenses() to authenticated;

-- Budgets. Without budget-vs-actual variance, an expenditure page is a receipt
-- drawer rather than a management tool.
create table if not exists public.budgets (
  period       date not null,   -- first of the month
  account_code text not null references public.ledger_accounts(code),
  amount_cents bigint not null check (amount_cents >= 0),
  primary key (period, account_code)
);

alter table public.budgets enable row level security;
drop policy if exists "budgets staff all" on public.budgets;
create policy "budgets staff all" on public.budgets for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 6. The P&L — the page the founder asked for.
-- ---------------------------------------------------------------------------

create or replace function public.finance_pl(p_from date, p_to date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role         text;
  v_gmv          bigint;
  v_host_payouts bigint;
  v_taxes        bigint;
  v_net_revenue  bigint;
  v_variable     bigint;
  v_fixed        bigint;
  v_bookings     int;
  v_new_users    int;
  v_marketing    bigint;
  v_escrow       bigint;
  v_deferred     bigint;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  -- GMV = what guests paid for stays that STARTED in the window. It is not revenue.
  select coalesce(sum(total_cents), 0), count(*)
    into v_gmv, v_bookings
    from bookings
   where status = 'confirmed' and start_date between p_from and p_to;

  -- Everything below comes from the ledger — one source, so nothing can disagree.
  select coalesce(sum(credit_cents - debit_cents), 0) into v_host_payouts
    from ledger_entries
   where account_code = '2000' and occurred_on between p_from and p_to;

  select coalesce(sum(credit_cents - debit_cents), 0) into v_taxes
    from ledger_entries
   where account_code = '2300' and occurred_on between p_from and p_to;

  select coalesce(sum(credit_cents - debit_cents), 0) into v_net_revenue
    from ledger_entries le join ledger_accounts la on la.code = le.account_code
   where la.kind = 'revenue' and le.occurred_on between p_from and p_to;

  select coalesce(sum(debit_cents - credit_cents), 0) into v_variable
    from ledger_entries le join ledger_accounts la on la.code = le.account_code
   where la.kind = 'expense' and la.is_variable and le.occurred_on between p_from and p_to;

  select coalesce(sum(debit_cents - credit_cents), 0) into v_fixed
    from ledger_entries le join ledger_accounts la on la.code = le.account_code
   where la.kind = 'expense' and not la.is_variable and le.occurred_on between p_from and p_to;

  select coalesce(sum(debit_cents - credit_cents), 0) into v_marketing
    from ledger_entries where account_code = '6100' and occurred_on between p_from and p_to;

  select count(*) into v_new_users
    from profiles where created_at::date between p_from and p_to;

  -- Balances are AS OF the end of the window, not sums within it.
  select coalesce(sum(debit_cents - credit_cents), 0) into v_escrow
    from ledger_entries where account_code = '1100' and occurred_on <= p_to;

  select coalesce(sum(credit_cents - debit_cents), 0) into v_deferred
    from ledger_entries where account_code = '2200' and occurred_on <= p_to;

  return jsonb_build_object(
    'from', p_from,
    'to',   p_to,

    'gmv',                v_gmv,
    'host_payouts',       v_host_payouts,
    'taxes_collected',    v_taxes,
    'net_revenue',        v_net_revenue,
    'variable_costs',     v_variable,
    'contribution_margin', v_net_revenue - v_variable,
    'fixed_costs',        v_fixed,
    'operating_profit',   v_net_revenue - v_variable - v_fixed,

    -- Held, not earned. Shown so nobody mistakes it for money we have.
    'escrow_float',       v_escrow,
    'deferred_revenue',   v_deferred,

    'bookings',           v_bookings,
    'arpb',               case when v_bookings > 0 then v_net_revenue / v_bookings else 0 end,
    'variable_per_booking', case when v_bookings > 0 then v_variable / v_bookings else 0 end,
    'cm_per_booking',     case when v_bookings > 0 then (v_net_revenue - v_variable) / v_bookings else 0 end,
    'take_rate_bps',      case when v_gmv > 0 then (v_net_revenue * 10000) / v_gmv else 0 end,

    'new_users',          v_new_users,
    'marketing_spend',    v_marketing,
    'blended_cac',        case when v_new_users > 0 then v_marketing / v_new_users else 0 end,

    -- Per-line detail, with budget variance where a budget exists.
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', la.code, 'name', la.name, 'kind', la.kind, 'is_variable', la.is_variable,
        'actual_cents', x.actual,
        'budget_cents', coalesce(bd.amount_cents, 0)
      ) order by la.sort_order)
      from ledger_accounts la
      join lateral (
        select coalesce(sum(
                 case when la.kind in ('expense','asset') then le.debit_cents - le.credit_cents
                      else le.credit_cents - le.debit_cents end
               ), 0) as actual
          from ledger_entries le
         where le.account_code = la.code and le.occurred_on between p_from and p_to
      ) x on true
      left join budgets bd
             on bd.account_code = la.code
            and bd.period = date_trunc('month', p_from)::date
      where la.kind in ('revenue', 'expense') and x.actual <> 0
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.finance_pl(date, date) from public, anon;
grant execute on function public.finance_pl(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Refunds can now exist — because there is now a ledger to record them in.
-- ---------------------------------------------------------------------------

update public.admin_actions_registry
   set enabled = true, disabled_reason = null
 where action = 'booking.refund';

-- ---------------------------------------------------------------------------
-- 8. Grants (explicit — see 0007)
-- ---------------------------------------------------------------------------

grant select on public.ledger_accounts    to authenticated;
grant select on public.ledger_entries     to authenticated;
grant select on public.platform_config    to authenticated;
grant select, insert on public.expenses   to authenticated;
grant select, insert, update, delete on public.recurring_expenses to authenticated;
grant select, insert, update, delete on public.budgets            to authenticated;

revoke update, delete on public.ledger_entries from authenticated;  -- post_journal only
revoke update, delete on public.expenses       from authenticated;  -- reverse, don't edit

revoke all on public.ledger_entries     from anon;
revoke all on public.expenses           from anon;
revoke all on public.recurring_expenses from anon;
revoke all on public.budgets            from anon;

-- ---------------------------------------------------------------------------
-- 9. The state-change CASE moves out of admin_action() into a helper.
--
-- admin_action() keeps everything that must be true of EVERY action (permission,
-- idempotency, blast radius, dry-run, four-eyes, audit, event). This helper holds
-- only "what does this action do to the world". Adding an action now touches one
-- place instead of re-pasting a 200-line function — and there is still exactly one
-- door, which was the whole point.
-- ---------------------------------------------------------------------------

create or replace function public.admin_apply(
  p_action       text,
  p_subject_id   text,
  p_payload      jsonb,
  p_reason_code  text,
  p_note         text,
  p_actor        uuid,
  p_role         text
) returns jsonb            -- { before, after }
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before   jsonb;
  v_after    jsonb;
  v_new_role text;
  v_enabled  boolean;
  v_amount   bigint;
  s          jsonb;
  b          bookings;
  v_host_cut bigint;
begin
  case p_action

    when 'user.suspend' then
      select to_jsonb(p) - 'avatar_url' into v_before from profiles p where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: user %', p_subject_id using errcode = '22023';
      end if;
      update profiles set status='suspended', suspended_at=now(), suspended_reason=p_reason_code
       where id = p_subject_id::uuid;
      select to_jsonb(p) - 'avatar_url' into v_after from profiles p where id = p_subject_id::uuid;

    when 'user.reinstate' then
      select to_jsonb(p) - 'avatar_url' into v_before from profiles p where id = p_subject_id::uuid;
      update profiles set status='active', suspended_at=null, suspended_reason=null
       where id = p_subject_id::uuid;
      select to_jsonb(p) - 'avatar_url' into v_after from profiles p where id = p_subject_id::uuid;

    when 'user.grant_role' then
      v_new_role := p_payload->>'role';
      if v_new_role is null or v_new_role not in ('guest','host','staff','admin') then
        raise exception 'ADMIN_ACTION_INVALID_PAYLOAD: role must be guest|host|staff|admin'
          using errcode = '22023';
      end if;
      select jsonb_build_object('role', role) into v_before from profiles where id = p_subject_id::uuid;
      update profiles set role = v_new_role where id = p_subject_id::uuid;
      select jsonb_build_object('role', role) into v_after from profiles where id = p_subject_id::uuid;

    when 'listing.approve' then
      select jsonb_build_object('moderation_status', moderation_status) into v_before
        from listings where id = p_subject_id::uuid;
      update listings set moderation_status='approved', moderated_at=now(), moderation_note=p_note
       where id = p_subject_id::uuid;
      select jsonb_build_object('moderation_status', moderation_status) into v_after
        from listings where id = p_subject_id::uuid;

    when 'listing.request_changes' then
      select jsonb_build_object('moderation_status', moderation_status) into v_before
        from listings where id = p_subject_id::uuid;
      update listings set moderation_status='changes_requested', moderated_at=now(), moderation_note=p_note
       where id = p_subject_id::uuid;
      select jsonb_build_object('moderation_status', moderation_status) into v_after
        from listings where id = p_subject_id::uuid;

    when 'listing.reject' then
      select jsonb_build_object('moderation_status', moderation_status) into v_before
        from listings where id = p_subject_id::uuid;
      update listings set moderation_status='rejected', moderated_at=now(), moderation_note=p_note
       where id = p_subject_id::uuid;
      select jsonb_build_object('moderation_status', moderation_status) into v_after
        from listings where id = p_subject_id::uuid;

    when 'review.remove' then
      select jsonb_build_object('status', status) into v_before from reviews where id = p_subject_id::uuid;
      update reviews set status='removed' where id = p_subject_id::uuid;
      select jsonb_build_object('status', status) into v_after from reviews where id = p_subject_id::uuid;

    when 'review.restore' then
      select jsonb_build_object('status', status) into v_before from reviews where id = p_subject_id::uuid;
      update reviews set status='visible' where id = p_subject_id::uuid;
      select jsonb_build_object('status', status) into v_after from reviews where id = p_subject_id::uuid;

    when 'booking.cancel' then
      select jsonb_build_object('status', status, 'total_cents', total_cents) into v_before
        from bookings where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: booking %', p_subject_id using errcode = '22023';
      end if;
      update bookings set status='cancelled' where id = p_subject_id::uuid;   -- trigger reverses the capture
      select jsonb_build_object('status', status, 'total_cents', total_cents) into v_after
        from bookings where id = p_subject_id::uuid;

    -- Enabled in 0010: there is finally a ledger to record it in.
    when 'booking.refund' then
      select * into b from bookings where id = p_subject_id::uuid;
      if b.id is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: booking %', p_subject_id using errcode = '22023';
      end if;

      v_amount := coalesce((p_payload->>'amount_cents')::bigint, b.total_cents);
      if v_amount <= 0 or v_amount > b.total_cents then
        raise exception 'ADMIN_ACTION_INVALID_PAYLOAD: refund must be between 1 and the booking total (%)',
          b.total_cents using errcode = '22023';
      end if;

      s := booking_fee_split(b);
      -- Claw the host's share back proportionally; the platform eats the rest. A
      -- refund that quietly came only out of our fees would flatter the P&L.
      v_host_cut := (( (s->>'host_payout')::bigint + (s->>'plug')::bigint ) * v_amount) / b.total_cents;

      perform post_journal(
        jsonb_build_array(
          jsonb_build_object('account', '2000', 'debit_cents',  v_host_cut),
          jsonb_build_object('account', '5200', 'debit_cents',  v_amount - v_host_cut),
          jsonb_build_object('account', '1100', 'credit_cents', v_amount)
        ),
        current_date,
        coalesce(p_note, 'Refund'), 'refund', p_subject_id
      );

      v_before := jsonb_build_object('refunded_cents', 0, 'total_cents', b.total_cents);
      v_after  := jsonb_build_object('refunded_cents', v_amount, 'total_cents', b.total_cents);

    when 'incident.assign' then
      select jsonb_build_object('status', status, 'assigned_to', assigned_to) into v_before
        from incidents where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: incident %', p_subject_id using errcode = '22023';
      end if;
      update incidents
         set assigned_to = coalesce((p_payload->>'assignee')::uuid, p_actor),
             status = case when status = 'new' then 'assigned' else status end,
             updated_at = now()
       where id = p_subject_id::uuid;
      select jsonb_build_object('status', status, 'assigned_to', assigned_to) into v_after
        from incidents where id = p_subject_id::uuid;
      insert into incident_events (incident_id, kind, body, actor_id, actor_label)
      values (p_subject_id::uuid, 'assigned', coalesce(p_note, 'Assigned'), p_actor, p_role);

    when 'incident.resolve' then
      select jsonb_build_object('status', status) into v_before from incidents where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: incident %', p_subject_id using errcode = '22023';
      end if;
      update incidents set status='resolved', resolved_at=now(), updated_at=now()
       where id = p_subject_id::uuid;
      select jsonb_build_object('status', status) into v_after from incidents where id = p_subject_id::uuid;
      insert into incident_events (incident_id, kind, body, actor_id, actor_label)
      values (p_subject_id::uuid, 'resolved', coalesce(p_note, p_reason_code), p_actor, p_role);

    when 'flag.toggle' then
      select jsonb_build_object('enabled', enabled) into v_before from feature_flags where key = p_subject_id;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: flag %', p_subject_id using errcode = '22023';
      end if;
      v_enabled := coalesce((p_payload->>'enabled')::boolean, not (v_before->>'enabled')::boolean);
      update feature_flags set enabled = v_enabled, updated_by = p_actor, updated_at = now()
       where key = p_subject_id;
      select jsonb_build_object('enabled', enabled) into v_after from feature_flags where key = p_subject_id;

    else
      raise exception 'ADMIN_ACTION_UNHANDLED: % is registered but has no handler', p_action
        using errcode = '22023';
  end case;

  return jsonb_build_object('before', v_before, 'after', v_after);
end;
$$;

-- admin_action() now delegates the "what does it do" part and keeps the guarantees.
create or replace function public.admin_action(
  p_action          text,
  p_subject_type    text,
  p_subject_id      text,
  p_reason_code     text    default null,
  p_note            text    default null,
  p_payload         jsonb   default '{}'::jsonb,
  p_idempotency_key text    default null,
  p_dry_run         boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor    uuid := auth.uid();
  v_role     text;
  v_reg      public.admin_actions_registry%rowtype;
  v_prior    jsonb;
  v_radius   jsonb;
  v_applied  jsonb;
  v_amount   bigint := coalesce((p_payload->>'amount_cents')::bigint, 0);
  v_needs_approval boolean := false;
  v_approval uuid;
  v_audit_id uuid;
  v_result   jsonb;
  v_total    bigint;
begin
  if v_actor is null then
    raise exception 'ADMIN_ACTION_UNAUTHENTICATED' using errcode = '42501';
  end if;

  select role into v_role from profiles where id = v_actor;
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_reg from admin_actions_registry where action = p_action;
  if not found then
    raise exception 'ADMIN_ACTION_UNKNOWN: %', p_action using errcode = '22023';
  end if;
  if not v_reg.enabled then
    raise exception 'ADMIN_ACTION_NOT_ENABLED: % — %', p_action, coalesce(v_reg.disabled_reason, 'not yet built')
      using errcode = '22023';
  end if;
  if v_reg.admin_only and v_role <> 'admin' then
    raise exception 'ADMIN_ACTION_FORBIDDEN: % requires the admin role', p_action using errcode = '42501';
  end if;
  if v_reg.subject_type <> p_subject_type then
    raise exception 'ADMIN_ACTION_SUBJECT_MISMATCH: % acts on %, got %',
      p_action, v_reg.subject_type, p_subject_type using errcode = '22023';
  end if;

  if p_action in ('user.suspend', 'user.grant_role') and p_subject_id = v_actor::text then
    raise exception 'ADMIN_ACTION_FORBIDDEN: you cannot perform % on your own account', p_action
      using errcode = '42501';
  end if;

  -- Reason + emergency-note are checked ONLY on a real commit: a dry run exists so
  -- the UI can show the blast radius *in the dialog that collects the reason*.
  if not p_dry_run then
    if v_reg.requires_reason then
      if p_reason_code is null then
        raise exception 'ADMIN_ACTION_REASON_REQUIRED: % needs a reason code', p_action using errcode = '22023';
      end if;
      if not exists (
        select 1 from reason_codes where code = p_reason_code and active and applies_to = v_reg.subject_type
      ) then
        raise exception 'ADMIN_ACTION_REASON_INVALID: % is not a valid reason for a % action',
          p_reason_code, v_reg.subject_type using errcode = '22023';
      end if;
    end if;

    if p_action = 'flag.toggle'
       and exists (select 1 from feature_flags where key = p_subject_id and is_emergency)
       and coalesce(trim(p_note), '') = '' then
      raise exception 'ADMIN_ACTION_INVALID_PAYLOAD: an emergency flag needs a written note'
        using errcode = '22023';
    end if;
  end if;

  if p_idempotency_key is not null then
    select result into v_prior from audit_log where idempotency_key = p_idempotency_key;
    if v_prior is not null then
      return v_prior || jsonb_build_object('replayed', true);
    end if;
  end if;

  -- Validate the payload BEFORE the approval gate. Otherwise an impossible refund
  -- (more than the guest ever paid) is large enough to trip the four-eyes threshold
  -- and a second person gets asked to approve something that cannot be executed.
  -- Nobody should ever be asked to sign off on arithmetic that doesn't exist.
  if p_action = 'booking.refund' then
    select total_cents into v_total from bookings where id = p_subject_id::uuid;
    if v_total is null then
      raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: booking %', p_subject_id using errcode = '22023';
    end if;
    if v_amount <= 0 or v_amount > v_total then
      raise exception 'ADMIN_ACTION_INVALID_PAYLOAD: refund must be between 1 and the booking total (%)',
        v_total using errcode = '22023';
    end if;
  end if;

  v_radius := admin_blast_radius(p_action, p_subject_type, p_subject_id);
  v_needs_approval := v_reg.approval_threshold_cents is not null
                      and v_amount >= v_reg.approval_threshold_cents;

  if p_dry_run then
    return jsonb_build_object(
      'dry_run', true, 'action', p_action, 'label', v_reg.label,
      'subject_type', p_subject_type, 'subject_id', p_subject_id,
      'blast_radius', v_radius, 'requires_approval', v_needs_approval,
      'undo_window_minutes', v_reg.undo_window_minutes
    );
  end if;

  if v_needs_approval then
    select id into v_approval from approvals
     where action = p_action and subject_id = p_subject_id and status = 'approved'
       and decided_by <> v_actor and expires_at > now()
     order by decided_at desc limit 1;

    if v_approval is null then
      insert into approvals (action, subject_type, subject_id, payload, reason_code, note, requested_by)
      values (p_action, p_subject_type, p_subject_id, p_payload, p_reason_code, p_note, v_actor)
      returning id into v_approval;
      return jsonb_build_object(
        'status', 'pending_approval', 'approval_id', v_approval, 'action', p_action,
        'blast_radius', v_radius, 'message', 'This action needs a second approver.'
      );
    end if;
    update approvals set status = 'consumed' where id = v_approval;
  end if;

  v_applied := admin_apply(p_action, p_subject_id, p_payload, p_reason_code, p_note, v_actor, v_role);

  v_result := jsonb_build_object(
    'status', 'applied', 'action', p_action,
    'subject_type', p_subject_type, 'subject_id', p_subject_id,
    'before', v_applied->'before', 'after', v_applied->'after', 'blast_radius', v_radius,
    'undo_until', case when v_reg.undo_window_minutes is not null
                       then to_jsonb(now() + (v_reg.undo_window_minutes || ' minutes')::interval)
                       else 'null'::jsonb end
  );

  insert into audit_log (
    actor_id, actor_role, action, subject_type, subject_id,
    reason_code, note, before, after, blast_radius, result, idempotency_key
  ) values (
    v_actor, v_role, p_action, p_subject_type, p_subject_id,
    p_reason_code, p_note, v_applied->'before', v_applied->'after', v_radius, v_result, p_idempotency_key
  ) returning id into v_audit_id;

  insert into events (name, actor_id, actor_role, subject_type, subject_id, payload, source)
  values (p_action, v_actor, v_role, p_subject_type, p_subject_id,
          jsonb_build_object('reason_code', p_reason_code, 'audit_id', v_audit_id, 'blast_radius', v_radius),
          'admin');

  return v_result || jsonb_build_object('audit_id', v_audit_id);
end;
$$;

revoke all on function public.admin_apply(text, text, jsonb, text, text, uuid, text) from public, anon, authenticated;
