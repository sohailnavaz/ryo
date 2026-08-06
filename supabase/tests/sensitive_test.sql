-- Isolation on the highest-stakes tables: payments, payouts, bank details, KYC,
-- incidents. A leak here is exposed money or government IDs, not just a role. These
-- assertions FAIL if one user can reach another's sensitive rows.

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('55550000-0000-4000-8000-000000000a01','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sens-a@test','x',now(),'{}','{"full_name":"A"}',now(),now()),
 ('55550000-0000-4000-8000-000000000a02','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sens-b@test','x',now(),'{}','{"full_name":"B"}',now(),now());
update profiles set role='host' where id in ('55550000-0000-4000-8000-000000000a01','55550000-0000-4000-8000-000000000a02');

insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng)
values ('55550000-0000-4000-8000-0000000000b1','55550000-0000-4000-8000-000000000a02','B loft',300000,'INR','loft','Goa','India',15.3,74.0);
insert into bookings (id, listing_id, guest_id, start_date, end_date, total_cents, status)
values ('55550000-0000-4000-8000-0000000000c1','55550000-0000-4000-8000-0000000000b1','55550000-0000-4000-8000-000000000a02',current_date+5,current_date+8,300000,'confirmed');

-- B's sensitive rows (inserted as postgres, bypassing RLS, as the system would).
insert into payment_intents (booking_id, guest_id, amount_cents, currency, provider, provider_ref, status)
  values ('55550000-0000-4000-8000-0000000000c1','55550000-0000-4000-8000-000000000a02',300000,'INR','stripe','pi_SECRET_B','succeeded');
insert into payouts (host_id, booking_id, amount_cents, currency, status)
  values ('55550000-0000-4000-8000-000000000a02','55550000-0000-4000-8000-0000000000c1',255000,'INR','scheduled');
insert into host_payout_methods (host_id, kind, account_name, account_number, routing_code, currency)
  values ('55550000-0000-4000-8000-000000000a02','bank','B Bank','000111222333','IFSC0001','INR');
insert into host_kyc_checks (host_id, check_type, status, reference)
  values ('55550000-0000-4000-8000-000000000a02','id','verified','KYC_SECRET_B');

create or replace function pg_temp.act_as(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',p::text,'role','authenticated')::text, true);
      perform set_config('role','authenticated', true); end $$;
create or replace function pg_temp.as_pg() returns void language plpgsql as $$ begin reset role; end $$;

-- 1. User A cannot read B's payments / payouts / bank details / KYC ----------
do $$
declare n int;
begin
  perform pg_temp.act_as('55550000-0000-4000-8000-000000000a01');   -- A, an unrelated user
  select count(*) into n from payment_intents;     if n<>0 then raise exception 'FAIL 1: A reads % payment_intents (LEAK)', n; end if;
  select count(*) into n from payouts;             if n<>0 then raise exception 'FAIL 1: A reads % payouts (LEAK)', n; end if;
  select count(*) into n from host_payout_methods; if n<>0 then raise exception 'FAIL 1: A reads % bank methods (LEAK)', n; end if;
  select count(*) into n from host_kyc_checks;     if n<>0 then raise exception 'FAIL 1: A reads % KYC rows (LEAK)', n; end if;
  perform pg_temp.as_pg();
  raise notice 'PASS 1: payments/payouts/bank/KYC are invisible to an unrelated user';
end $$;

-- 2. B CAN see B's own (sanity — the policy isn't just deny-all) -------------
do $$
declare n int;
begin
  perform pg_temp.act_as('55550000-0000-4000-8000-000000000a02');
  select count(*) into n from payouts;             if n<>1 then raise exception 'FAIL 2: owner sees % own payouts', n; end if;
  select count(*) into n from host_payout_methods; if n<>1 then raise exception 'FAIL 2: owner sees % own bank methods', n; end if;
  perform pg_temp.as_pg();
  raise notice 'PASS 2: owner sees exactly their own sensitive rows';
end $$;

-- 3. Incidents: cross-user isolation ---------------------------------------
do $$
declare iid uuid; n int;
begin
  perform pg_temp.act_as('55550000-0000-4000-8000-000000000a02');   -- B raises an incident
  insert into incidents (guest_id, guest_name, category, tier, status, subject, detail)
    values ('55550000-0000-4000-8000-000000000a02','B','safety',1,'new','Broken lock','detail') returning id into iid;
  perform pg_temp.as_pg();
  perform pg_temp.act_as('55550000-0000-4000-8000-000000000a01');   -- A (unrelated)
  select count(*) into n from incidents; if n<>0 then raise exception 'FAIL 3: A reads % of B''s incidents (LEAK)', n; end if;
  perform pg_temp.as_pg();
  raise notice 'PASS 3: incidents not visible to unrelated users';
end $$;

-- 4. Privilege: a guest must NOT be able to self-resolve or re-tier their own
--    incident — that is staff's job. (This probes main's broad guest-UPDATE policy.)
do $$
declare iid uuid; st text;
begin
  perform pg_temp.act_as('55550000-0000-4000-8000-000000000a02');
  insert into incidents (guest_id, guest_name, category, tier, status, subject, detail)
    values ('55550000-0000-4000-8000-000000000a02','B','safety',1,'new','Self resolve?','d') returning id into iid;
  -- attempt to mark it resolved as the guest
  update incidents set status='resolved' where id=iid;
  select status into st from incidents where id=iid;
  perform pg_temp.as_pg();
  if st='resolved' then
    raise exception 'FINDING 4: a guest self-resolved their own incident (status=%). Guest UPDATE policy is too broad — should be staff-only for status/tier/assignment.', st;
  end if;
  raise notice 'PASS 4: a guest cannot self-resolve their own incident';
end $$;

rollback;
