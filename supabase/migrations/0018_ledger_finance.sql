-- 0018_ledger_finance.sql — double-entry ledger + P&L (ported onto main).
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

-- ---------------------------------------------------------------------------
-- Adaptation for main's booking flow.
--
-- main's bookings move pending → accepted → confirmed → declined/cancelled, so a
-- booking often reaches 'confirmed' via an UPDATE, not on insert. Re-point the
-- capture trigger to fire when a booking BECOMES confirmed (insert or update); the
-- existing-journal guard inside post_booking_capture() keeps it idempotent. Reverse
-- on cancelled OR declined (declined-from-pending simply no-ops — no capture existed).
-- ---------------------------------------------------------------------------

drop trigger if exists booking_capture_trg on public.bookings;
create trigger booking_capture_trg
  after insert or update of status on public.bookings
  for each row when (new.status = 'confirmed')
  execute function public.post_booking_capture();

drop trigger if exists booking_cancel_trg on public.bookings;
create trigger booking_cancel_trg
  after update of status on public.bookings
  for each row when (new.status in ('cancelled', 'declined'))
  execute function public.post_booking_cancel();

-- post_booking_cancel keys off status='cancelled'; broaden it to declined too.
create or replace function public.post_booking_cancel()
returns trigger language plpgsql security definer set search_path = public as $$
declare s jsonb; v_host_pay bigint;
begin
  if new.status not in ('cancelled','declined') or old.status = new.status then return new; end if;
  if not exists (select 1 from ledger_entries where ref_type='booking' and ref_id=new.id::text) then return new; end if;
  if exists (select 1 from ledger_entries where ref_type='booking_reversal' and ref_id=new.id::text) then return new; end if;
  s := booking_fee_split(new);
  v_host_pay := (s->>'host_payout')::bigint + (s->>'plug')::bigint;
  perform post_journal(
    jsonb_build_array(
      jsonb_build_object('account','2000','debit_cents', v_host_pay),
      jsonb_build_object('account','2300','debit_cents', (s->>'taxes')::bigint),
      jsonb_build_object('account','2200','debit_cents', (s->>'our_fees')::bigint),
      jsonb_build_object('account','1100','credit_cents', new.total_cents)),
    current_date, 'Booking cancelled — capture reversed', 'booking_reversal', new.id::text);
  return new;
end $$;

-- Standalone refund — main's admin (no admin_action() here) calls this directly.
-- Staff-only, validated, posts a balanced refund journal, drains escrow, claws the
-- host's share back proportionally so the platform doesn't silently eat it.
create or replace function public.refund_booking(p_booking uuid, p_amount_cents bigint, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b bookings; s jsonb; v_host_cut bigint; v_role text;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('staff','admin') then
    raise exception 'REFUND_FORBIDDEN' using errcode='42501';
  end if;
  select * into b from bookings where id = p_booking;
  if b.id is null then raise exception 'REFUND_BOOKING_NOT_FOUND' using errcode='22023'; end if;
  if p_amount_cents <= 0 or p_amount_cents > b.total_cents then
    raise exception 'REFUND_INVALID_AMOUNT: must be 1..% (booking total)', b.total_cents using errcode='22023';
  end if;
  s := booking_fee_split(b);
  v_host_cut := (((s->>'host_payout')::bigint + (s->>'plug')::bigint) * p_amount_cents) / b.total_cents;
  perform post_journal(
    jsonb_build_array(
      jsonb_build_object('account','2000','debit_cents', v_host_cut),
      jsonb_build_object('account','5200','debit_cents', p_amount_cents - v_host_cut),
      jsonb_build_object('account','1100','credit_cents', p_amount_cents)),
    current_date, coalesce(p_note,'Refund'), 'refund', p_booking::text);
  return jsonb_build_object('status','refunded','amount_cents',p_amount_cents);
end $$;
revoke all on function public.refund_booking(uuid, bigint, text) from public, anon;
grant execute on function public.refund_booking(uuid, bigint, text) to authenticated;
