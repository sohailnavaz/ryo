-- Saved searches: RLS scope + the new-listing match trigger (migration 0023).
-- Self-contained: fixtures + BEGIN…ROLLBACK, RAISEs on any failed assertion.

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('66660000-0000-4000-8000-000000000a01','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ss-a@test','x',now(),'{}','{"full_name":"Saver A"}',now(),now()),
 ('66660000-0000-4000-8000-000000000a02','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ss-b@test','x',now(),'{}','{"full_name":"Host B"}',now(),now());
update profiles set role='host' where id='66660000-0000-4000-8000-000000000a02';

create or replace function pg_temp.act_as(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',p::text,'role','authenticated')::text, true);
      perform set_config('role','authenticated', true); end $$;
create or replace function pg_temp.as_pg() returns void language plpgsql as $$ begin reset role; end $$;

-- A saves: Goa, ≥2 guests, ≤ 4000 (400000 cents), villas.
insert into saved_searches (id, profile_id, label, destination, guests, max_price_cents, property_types, notify)
values ('66660000-0000-4000-8000-0000000000f1','66660000-0000-4000-8000-000000000a01',
        'Goa','Goa',2,400000,array['villa'],true);

-- TEST 1 — saved searches are owner-scoped.
do $$
begin
  perform pg_temp.act_as('66660000-0000-4000-8000-000000000a02');
  if exists (select 1 from saved_searches where profile_id='66660000-0000-4000-8000-000000000a01') then
    perform pg_temp.as_pg(); raise exception 'FAIL 1: another user reads my saved search';
  end if;
  perform pg_temp.as_pg();
  perform pg_temp.act_as('66660000-0000-4000-8000-000000000a01');
  if (select count(*) from saved_searches) <> 1 then
    perform pg_temp.as_pg(); raise exception 'FAIL 1: owner cannot read own saved search';
  end if;
  perform pg_temp.as_pg();
  raise notice 'PASS 1: saved searches are owner-scoped';
end $$;

-- TEST 2 — a matching new listing notifies the saver.
do $$
declare n int;
begin
  insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng, max_guests)
  values ('66660000-0000-4000-8000-0000000000e1','66660000-0000-4000-8000-000000000a02',
          'Cliff villa',300000,'INR','villa','Goa','India',15.3,74.0,4);
  select count(*) into n from notifications
   where profile_id='66660000-0000-4000-8000-000000000a01' and title='New place matches your search';
  if n <> 1 then raise exception 'FAIL 2: saver not notified of matching listing (got %)', n; end if;
  raise notice 'PASS 2: matching new listing notifies the saver';
end $$;

-- TEST 3 — a non-matching listing does NOT notify (still exactly one match notif).
do $$
declare n int;
begin
  insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng, max_guests)
  values ('66660000-0000-4000-8000-0000000000e2','66660000-0000-4000-8000-000000000a02',
          'Paris flat',300000,'EUR','apartment','Paris','France',48.8,2.3,4);
  select count(*) into n from notifications
   where profile_id='66660000-0000-4000-8000-000000000a01' and title='New place matches your search';
  if n <> 1 then raise exception 'FAIL 3: a non-matching listing notified the saver (count now %)', n; end if;
  raise notice 'PASS 3: non-matching listing does not notify';
end $$;

-- TEST 4 — a host is not alerted about their own matching listing.
do $$
declare n int;
begin
  insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng, max_guests)
  values ('66660000-0000-4000-8000-0000000000e3','66660000-0000-4000-8000-000000000a01',
          'A''s own villa',300000,'INR','villa','Goa','India',15.3,74.0,4);
  select count(*) into n from notifications
   where profile_id='66660000-0000-4000-8000-000000000a01' and title='New place matches your search';
  if n <> 1 then raise exception 'FAIL 4: saver alerted about their own listing (count %)', n; end if;
  raise notice 'PASS 4: a host is not alerted about their own listing';
end $$;

rollback;
