-- Ledger & finance correctness. (migration 0010)
--
-- The money-critical path: a booking must post a balanced journal, revenue must not
-- be recognised before check-in, GMV must never equal net revenue, refunds must post
-- and drain escrow, the ledger must be immutable and always balance. Self-contained:
-- creates its own fixtures, asserts with RAISE, and ROLLBACKs so it's repeatable.

begin;

-- Fixtures ------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('11110000-0000-4000-8000-000000000a01','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ledger-admin@test','x',now(),'{}','{"full_name":"Fin"}',now(),now()),
 ('11110000-0000-4000-8000-000000000a02','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ledger-host@test','x',now(),'{}','{"full_name":"Host"}',now(),now()),
 ('11110000-0000-4000-8000-000000000a03','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ledger-guest@test','x',now(),'{}','{"full_name":"Guest"}',now(),now());
update profiles set role='admin' where id='11110000-0000-4000-8000-000000000a01';
update profiles set role='host'  where id='11110000-0000-4000-8000-000000000a02';

insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng)
values ('11110000-0000-4000-8000-0000000000b1','11110000-0000-4000-8000-000000000a02','Ledger villa',500000,'INR','villa','Goa','India',15.3,74.0);

create or replace function pg_temp.act_as(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',p::text,'role','authenticated')::text, true);
      perform set_config('role','authenticated', true); end $$;
create or replace function pg_temp.as_pg() returns void language plpgsql as $$
begin reset role; end $$;

-- 1. A confirmed booking auto-posts a BALANCED journal into escrow ----------
do $$
declare d bigint; c bigint; esc bigint;
begin
  insert into bookings (id, listing_id, guest_id, start_date, end_date, total_cents, status,
                        subtotal_cents, cleaning_fee_cents, service_fee_cents, taxes_cents, discount_cents)
  values ('11110000-0000-4000-8000-0000000000c1','11110000-0000-4000-8000-0000000000b1',
          '11110000-0000-4000-8000-000000000a03', current_date-5, current_date, 618800,'confirmed',
          500000,20000,72800,26000,0);
  select coalesce(sum(debit_cents),0), coalesce(sum(credit_cents),0) into d,c
    from ledger_entries where ref_type='booking' and ref_id='11110000-0000-4000-8000-0000000000c1';
  if d<>c then raise exception 'FAIL 1: journal unbalanced % vs %', d,c; end if;
  if d<>618800 then raise exception 'FAIL 1: journal moved %, expected 618800', d; end if;
  select coalesce(sum(debit_cents-credit_cents),0) into esc from ledger_entries where account_code='1100';
  if esc<>618800 then raise exception 'FAIL 1: escrow=%', esc; end if;
  raise notice 'PASS 1: booking posts a balanced journal, full total into escrow';
end $$;

-- 2. Fees are DEFERRED, not revenue, until check-in -------------------------
do $$
declare rev bigint; def bigint;
begin
  select coalesce(sum(le.credit_cents-le.debit_cents),0) into rev
    from ledger_entries le join ledger_accounts la on la.code=le.account_code where la.kind='revenue';
  select coalesce(sum(credit_cents-debit_cents),0) into def from ledger_entries where account_code='2200';
  if rev<>0 then raise exception 'FAIL 2: revenue recognised before check-in (%)', rev; end if;
  if def<=0 then raise exception 'FAIL 2: fees not deferred'; end if;
  raise notice 'PASS 2: fees deferred, zero revenue before check-in';
end $$;

-- 3. recognize_revenue() moves deferred → revenue at check-in ---------------
do $$
declare n int; rev bigint; def bigint;
begin
  perform pg_temp.act_as('11110000-0000-4000-8000-000000000a01');
  n := recognize_revenue();
  perform pg_temp.as_pg();
  select coalesce(sum(le.credit_cents-le.debit_cents),0) into rev
    from ledger_entries le join ledger_accounts la on la.code=le.account_code where la.kind='revenue';
  select coalesce(sum(credit_cents-debit_cents),0) into def from ledger_entries where account_code='2200';
  if n<>1 then raise exception 'FAIL 3: recognised % bookings', n; end if;
  if def<>0 then raise exception 'FAIL 3: deferred still % after recognition', def; end if;
  if rev<>88400 then raise exception 'FAIL 3: revenue=%, expected 88400', rev; end if;  -- guest 72800 + host 3% of 520000
  raise notice 'PASS 3: check-in recognises revenue (deferred -> 0)';
end $$;

-- 4. GMV is NOT net revenue; host share is never ours -----------------------
do $$
declare pl jsonb;
begin
  perform pg_temp.act_as('11110000-0000-4000-8000-000000000a01');
  pl := finance_pl(current_date-30, current_date);
  perform pg_temp.as_pg();
  if (pl->>'gmv')::bigint <> 618800 then raise exception 'FAIL 4: gmv=%', pl->>'gmv'; end if;
  if (pl->>'net_revenue')::bigint <> 88400 then raise exception 'FAIL 4: net_revenue=%', pl->>'net_revenue'; end if;
  if (pl->>'net_revenue')::bigint >= (pl->>'gmv')::bigint then raise exception 'FAIL 4: net revenue not distinct from GMV'; end if;
  if (pl->>'host_payouts')::bigint <> 504400 then raise exception 'FAIL 4: host_payouts=%', pl->>'host_payouts'; end if;
  raise notice 'PASS 4: GMV != revenue; host share is a pass-through liability';
end $$;

-- 5. An unbalanced journal is REFUSED ---------------------------------------
do $$
declare err text;
begin
  perform pg_temp.act_as('11110000-0000-4000-8000-000000000a01');
  begin
    perform post_journal(jsonb_build_array(
      jsonb_build_object('account','1000','debit_cents',100),
      jsonb_build_object('account','6400','credit_cents',90)), current_date, 'bad');
    raise exception 'FAIL 5: unbalanced journal accepted';
  exception when sqlstate '22023' then
    get stacked diagnostics err = message_text;
    if err not like '%UNBALANCED%' then raise exception 'FAIL 5: wrong error %', err; end if;
  end;
  perform pg_temp.as_pg();
  raise notice 'PASS 5: unbalanced journals refused';
end $$;

-- 6. The ledger is immutable (correct via reversing entries, never edits) ---
do $$
declare err text;
begin
  begin
    update ledger_entries set memo='tampered' where id=(select min(id) from ledger_entries);
    raise exception 'FAIL 6: ledger was editable';
  exception when sqlstate '42501' then
    get stacked diagnostics err = message_text;
    if err not like '%LEDGER_IMMUTABLE%' then raise exception 'FAIL 6: wrong error %', err; end if;
  end;
  raise notice 'PASS 6: ledger is immutable';
end $$;

-- 7. A refund posts to the ledger and drains escrow -------------------------
do $$
declare res jsonb; ref bigint; esc bigint;
begin
  perform pg_temp.act_as('11110000-0000-4000-8000-000000000a01');
  res := refund_booking('11110000-0000-4000-8000-0000000000c1', 100000, 'plumbing');
  perform pg_temp.as_pg();
  if res->>'status' <> 'refunded' then raise exception 'FAIL 7: refund status %', res->>'status'; end if;
  select coalesce(sum(debit_cents),0) into ref from ledger_entries where ref_type='refund';
  if ref<>100000 then raise exception 'FAIL 7: refund posted %', ref; end if;
  select coalesce(sum(debit_cents-credit_cents),0) into esc from ledger_entries where account_code='1100';
  if esc<>518800 then raise exception 'FAIL 7: escrow=% after refund', esc; end if;
  raise notice 'PASS 7: refund posts + drains escrow';
end $$;

-- 8. A refund larger than the booking total is refused ----------------------
do $$
declare err text;
begin
  perform pg_temp.act_as('11110000-0000-4000-8000-000000000a01');
  begin
    perform refund_booking('11110000-0000-4000-8000-0000000000c1', 99999999, 'too much');
    raise exception 'FAIL 8: over-refund accepted';
  exception when sqlstate '22023' then
    get stacked diagnostics err = message_text;
    if err not like '%INVALID_AMOUNT%' then raise exception 'FAIL 8: wrong error %', err; end if;
  end;
  perform pg_temp.as_pg();
  raise notice 'PASS 8: cannot refund more than was paid';
end $$;

-- 9. THE books balance: every debit has a credit, every journal sums to zero -
do $$
declare d bigint; c bigint; bad int;
begin
  select coalesce(sum(debit_cents),0), coalesce(sum(credit_cents),0) into d,c from ledger_entries;
  if d<>c then raise exception 'FAIL 9: books do not balance % vs %', d,c; end if;
  select count(*) into bad from (
    select journal_id from ledger_entries group by journal_id having sum(debit_cents)<>sum(credit_cents)) x;
  if bad>0 then raise exception 'FAIL 9: % unbalanced journals', bad; end if;
  raise notice 'PASS 9: the books balance (every journal)';
end $$;

rollback;
