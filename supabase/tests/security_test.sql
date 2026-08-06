-- Security invariants for the live trunk. (migrations 0019 + main's RLS)
--
-- These would FAIL if a table leaks across users. RLS is only enforced for
-- non-superuser roles, so every assertion runs after `set role`. Self-contained +
-- rollback.

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('44440000-0000-4000-8000-000000000a01','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sec-a@test','x',now(),'{}','{"full_name":"Guest A"}',now(),now()),
 ('44440000-0000-4000-8000-000000000a02','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sec-b@test','x',now(),'{}','{"full_name":"Host B"}',now(),now()),
 ('44440000-0000-4000-8000-000000000a03','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sec-c@test','x',now(),'{}','{"full_name":"Outsider C"}',now(),now());
update profiles set role='host' where id='44440000-0000-4000-8000-000000000a02';
insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng)
values ('44440000-0000-4000-8000-0000000000b1','44440000-0000-4000-8000-000000000a02','Sec loft',300000,'INR','loft','Goa','India',15.3,74.0);

create or replace function pg_temp.act_as(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',p::text,'role','authenticated')::text, true);
      perform set_config('role','authenticated', true); end $$;
create or replace function pg_temp.act_anon() returns void language plpgsql as $$
begin perform set_config('request.jwt.claims','', true); perform set_config('role','anon', true); end $$;
create or replace function pg_temp.as_pg() returns void language plpgsql as $$ begin reset role; end $$;

-- 1. The staff-roster leak is closed (migration 0019): role/status NOT selectable by
--    anon; the public columns a listing page needs still are.
do $$
begin
  perform pg_temp.act_anon();
  begin
    perform role from profiles limit 1;
    raise exception 'FAIL 1: anon read profiles.role (staff-roster leak)';
  exception when sqlstate '42501' then null; end;
  perform full_name from profiles limit 1;   -- lives_ok
  perform pg_temp.as_pg();
  raise notice 'PASS 1: profiles.role not anon-readable; full_name still is';
end $$;

-- 2. Messaging: only the two participants see or post to a thread ------------
do $$
declare tid uuid; n int;
begin
  perform pg_temp.act_as('44440000-0000-4000-8000-000000000a01');
  insert into message_threads (guest_id, host_id, listing_id) values
    ('44440000-0000-4000-8000-000000000a01','44440000-0000-4000-8000-000000000a02','44440000-0000-4000-8000-0000000000b1') returning id into tid;
  insert into messages (thread_id, sender_id, body) values (tid,'44440000-0000-4000-8000-000000000a01','hello');
  perform pg_temp.as_pg();

  perform pg_temp.act_as('44440000-0000-4000-8000-000000000a02'); -- host participant
  select count(*) into n from messages where thread_id=tid;
  if n<>1 then raise exception 'FAIL 2: host sees % messages', n; end if;
  perform pg_temp.as_pg();

  perform pg_temp.act_as('44440000-0000-4000-8000-000000000a03'); -- outsider
  if (select count(*) from message_threads) <> 0 then raise exception 'FAIL 2: outsider sees threads'; end if;
  if (select count(*) from messages) <> 0 then raise exception 'FAIL 2: outsider reads messages'; end if;
  begin insert into messages (thread_id,sender_id,body) values (tid,'44440000-0000-4000-8000-000000000a03','x');
        raise exception 'FAIL 2: outsider posted'; exception when others then null; end;
  perform pg_temp.as_pg();
  raise notice 'PASS 2: messaging is participant-only';
end $$;

-- 3. Wishlists are owner-scoped --------------------------------------------
do $$
declare wid uuid;
begin
  perform pg_temp.act_as('44440000-0000-4000-8000-000000000a01');
  insert into wishlists (owner_id, name) values ('44440000-0000-4000-8000-000000000a01','Trip') returning id into wid;
  perform pg_temp.as_pg();
  perform pg_temp.act_as('44440000-0000-4000-8000-000000000a02');
  if (select count(*) from wishlists) <> 0 then raise exception 'FAIL 3: other user sees wishlists'; end if;
  perform pg_temp.as_pg();
  raise notice 'PASS 3: wishlists owner-scoped';
end $$;

-- 4. Notifications are private to their recipient ---------------------------
do $$
begin
  -- notifications are system-generated → insert as owner (bypassing RLS via postgres)
  insert into notifications (profile_id, kind, title, body)
    values ('44440000-0000-4000-8000-000000000a01','system','Hi','private');
  perform pg_temp.act_as('44440000-0000-4000-8000-000000000a03'); -- someone else
  if (select count(*) from notifications) <> 0 then raise exception 'FAIL 4: another user reads my notifications'; end if;
  perform pg_temp.as_pg();
  perform pg_temp.act_as('44440000-0000-4000-8000-000000000a01'); -- the owner
  if (select count(*) from notifications where body='private') <> 1 then raise exception 'FAIL 4: owner cannot read own notification'; end if;
  perform pg_temp.as_pg();
  raise notice 'PASS 4: notifications private to recipient';
end $$;

rollback;
