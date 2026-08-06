-- Notification triggers + RLS (migrations 0007 + 0022).
--
-- Proves the inbox actually lights up on real events, and that a user can't
-- forge notifications for anyone else. Self-contained: fixtures + BEGIN…ROLLBACK,
-- RAISEs on any failed assertion (ON_ERROR_STOP makes that fail the run).

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('55550000-0000-4000-8000-000000000a01','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ntf-guest@test','x',now(),'{}','{"full_name":"Guest N"}',now(),now()),
 ('55550000-0000-4000-8000-000000000a02','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ntf-host@test','x',now(),'{}','{"full_name":"Host N"}',now(),now()),
 ('55550000-0000-4000-8000-000000000a03','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ntf-out@test','x',now(),'{}','{"full_name":"Outsider N"}',now(),now());
update profiles set role='host' where id='55550000-0000-4000-8000-000000000a02';
insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng)
values ('55550000-0000-4000-8000-0000000000b1','55550000-0000-4000-8000-000000000a02','Notif villa',300000,'INR','villa','Goa','India',15.3,74.0);

create or replace function pg_temp.act_as(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',p::text,'role','authenticated')::text, true);
      perform set_config('role','authenticated', true); end $$;
create or replace function pg_temp.as_pg() returns void language plpgsql as $$ begin reset role; end $$;

-- TEST 1 — every new profile gets a welcome notification.
do $$
declare n int;
begin
  select count(*) into n from notifications
   where kind='system' and title='Welcome to Ryo'
     and profile_id in ('55550000-0000-4000-8000-000000000a01',
                        '55550000-0000-4000-8000-000000000a02',
                        '55550000-0000-4000-8000-000000000a03');
  if n <> 3 then raise exception 'FAIL 1: expected 3 welcome notifs, got %', n; end if;
  raise notice 'PASS 1: welcome notification on signup';
end $$;

-- TEST 2 — a new booking request notifies the host.
do $$
declare n int;
begin
  insert into bookings (id, listing_id, guest_id, start_date, end_date, total_cents, status,
                        subtotal_cents, cleaning_fee_cents, service_fee_cents, taxes_cents, discount_cents)
  values ('55550000-0000-4000-8000-0000000000c1','55550000-0000-4000-8000-0000000000b1',
          '55550000-0000-4000-8000-000000000a01', current_date+10, current_date+13, 300000,'pending',
          250000,10000,30000,10000,0);
  select count(*) into n from notifications
   where profile_id='55550000-0000-4000-8000-000000000a02' and kind='booking' and title='New booking request';
  if n <> 1 then raise exception 'FAIL 2: host not notified of request (got %)', n; end if;
  raise notice 'PASS 2: new booking request notifies host';
end $$;

-- TEST 3 — the host accepting notifies the guest. (Use 'accepted' so the test
-- stays isolated from the ledger capture that fires on 'confirmed'.)
do $$
declare n int;
begin
  update bookings set status='accepted' where id='55550000-0000-4000-8000-0000000000c1';
  select count(*) into n from notifications
   where profile_id='55550000-0000-4000-8000-000000000a01' and kind='booking' and title='Booking confirmed';
  if n <> 1 then raise exception 'FAIL 3: guest not notified of acceptance (got %)', n; end if;
  raise notice 'PASS 3: booking acceptance notifies guest';
end $$;

-- TEST 4 — a message notifies the OTHER participant, both directions.
do $$
declare n int;
begin
  insert into message_threads (id, listing_id, guest_id, host_id)
  values ('55550000-0000-4000-8000-0000000000d1','55550000-0000-4000-8000-0000000000b1',
          '55550000-0000-4000-8000-000000000a01','55550000-0000-4000-8000-000000000a02');
  insert into messages (thread_id, sender_id, body)
  values ('55550000-0000-4000-8000-0000000000d1','55550000-0000-4000-8000-000000000a01','Is parking included?');
  select count(*) into n from notifications
   where profile_id='55550000-0000-4000-8000-000000000a02' and kind='message';
  if n <> 1 then raise exception 'FAIL 4: host not notified of guest message (got %)', n; end if;

  insert into messages (thread_id, sender_id, body)
  values ('55550000-0000-4000-8000-0000000000d1','55550000-0000-4000-8000-000000000a02','Yes, free parking.');
  select count(*) into n from notifications
   where profile_id='55550000-0000-4000-8000-000000000a01' and kind='message';
  if n <> 1 then raise exception 'FAIL 4: guest not notified of host reply (got %)', n; end if;
  raise notice 'PASS 4: messages notify the counterparty';
end $$;

-- TEST 5 — a user cannot forge a notification for another user (self-insert RLS).
do $$
declare n int;
begin
  perform pg_temp.act_as('55550000-0000-4000-8000-000000000a01');
  begin
    insert into notifications (profile_id, kind, title)
    values ('55550000-0000-4000-8000-000000000a02','system','forged');
  exception when others then null;  -- RLS rejection is expected
  end;
  perform pg_temp.as_pg();
  select count(*) into n from notifications where title='forged';
  if n <> 0 then raise exception 'FAIL 5: a user forged % notification(s) for another user', n; end if;
  raise notice 'PASS 5: self-insert RLS blocks forging others'' notifications';
end $$;

-- TEST 6 — reads are scoped to the owner.
do $$
declare own int;
begin
  perform pg_temp.act_as('55550000-0000-4000-8000-000000000a01');
  if exists (select 1 from notifications where profile_id <> '55550000-0000-4000-8000-000000000a01') then
    perform pg_temp.as_pg();
    raise exception 'FAIL 6: guest can read another user''s notifications';
  end if;
  select count(*) into own from notifications;
  perform pg_temp.as_pg();
  if own = 0 then raise exception 'FAIL 6: guest cannot see their own notifications'; end if;
  raise notice 'PASS 6: notifications read-scoped to owner (guest sees % own)', own;
end $$;

rollback;
