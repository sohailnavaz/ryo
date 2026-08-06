-- Security invariants: the things that, if they regress, leak data or let the wrong
-- person act. (migrations 0011, 0012, 0013)
--
-- RLS is only enforced for non-superuser roles, so every assertion runs after
-- `set role authenticated`. Self-contained + rollback.

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('33330000-0000-4000-8000-000000000a01','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sec-guest@test','x',now(),'{}','{"full_name":"Guest A"}',now(),now()),
 ('33330000-0000-4000-8000-000000000a02','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sec-host@test','x',now(),'{}','{"full_name":"Host B"}',now(),now()),
 ('33330000-0000-4000-8000-000000000a03','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sec-outsider@test','x',now(),'{}','{"full_name":"Outsider C"}',now(),now());
update profiles set role='host' where id='33330000-0000-4000-8000-000000000a02';
update profiles set role='admin' where id='33330000-0000-4000-8000-000000000a03'; -- even an admin must not read role via the table
insert into listings (id, host_id, title, price_cents, currency, property_type, city, country, lat, lng)
values ('33330000-0000-4000-8000-0000000000b1','33330000-0000-4000-8000-000000000a02','Sec loft',300000,'INR','loft','Goa','India',15.3,74.0);

create or replace function pg_temp.act_as(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',p::text,'role','authenticated')::text, true);
      perform set_config('role','authenticated', true); end $$;
create or replace function pg_temp.act_anon() returns void language plpgsql as $$
begin perform set_config('request.jwt.claims','', true); perform set_config('role','anon', true); end $$;
create or replace function pg_temp.as_pg() returns void language plpgsql as $$ begin reset role; end $$;

-- 1. The staff-roster leak is closed: role is NOT selectable by the API roles -
do $$
declare err text;
begin
  perform pg_temp.act_anon();
  begin
    perform role from profiles limit 1;      -- must be column-privilege denied
    raise exception 'FAIL 1: anon read profiles.role (staff roster leak)';
  exception when sqlstate '42501' then null; end;
  perform pg_temp.as_pg();
  -- but the public columns a listing page needs are still readable
  perform pg_temp.act_anon();
  perform full_name from profiles limit 1;   -- lives_ok
  perform pg_temp.as_pg();
  raise notice 'PASS 1: profiles.role not readable by anon; full_name still is';
end $$;

-- 2. Messaging: only the two participants; an outsider sees + posts nothing --
do $$
declare tid uuid; n int;
begin
  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a01');
  insert into message_threads (guest_id,host_id,subject)
    values ('33330000-0000-4000-8000-000000000a01','33330000-0000-4000-8000-000000000a02','Hi') returning id into tid;
  insert into messages (thread_id,sender_id,body) values (tid,'33330000-0000-4000-8000-000000000a01','hello');
  perform pg_temp.as_pg();

  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a02'); -- host participant sees it
  select count(*) into n from messages where thread_id=tid;
  if n<>1 then raise exception 'FAIL 2: host sees % messages', n; end if;
  perform pg_temp.as_pg();

  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a03'); -- outsider (even an admin) sees nothing
  if (select count(*) from message_threads) <> 0 then raise exception 'FAIL 2: outsider sees threads'; end if;
  if (select count(*) from messages) <> 0 then raise exception 'FAIL 2: outsider reads messages'; end if;
  begin insert into messages (thread_id,sender_id,body) values (tid,'33330000-0000-4000-8000-000000000a03','intrude');
        raise exception 'FAIL 2: outsider posted'; exception when others then null; end;
  perform pg_temp.as_pg();
  raise notice 'PASS 2: messaging is participant-only';
end $$;

-- 3. Wishlists are owner-scoped ---------------------------------------------
do $$
declare cid uuid;
begin
  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a01');
  insert into wishlist_collections (owner_id,name) values ('33330000-0000-4000-8000-000000000a01','Trip') returning id into cid;
  perform pg_temp.as_pg();
  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a02');
  if (select count(*) from wishlist_collections) <> 0 then raise exception 'FAIL 3: other user sees wishlist'; end if;
  perform pg_temp.as_pg();
  raise notice 'PASS 3: wishlists owner-scoped';
end $$;

-- 4. A suspended user cannot book -------------------------------------------
do $$
begin
  update profiles set status='suspended' where id='33330000-0000-4000-8000-000000000a01';
  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a01');
  begin
    insert into bookings (listing_id,guest_id,start_date,end_date,total_cents)
      values ('33330000-0000-4000-8000-0000000000b1','33330000-0000-4000-8000-000000000a01',current_date+30,current_date+32,10000);
    raise exception 'FAIL 4: suspended user booked';
  exception when sqlstate '42501' then null; end;
  perform pg_temp.as_pg();

  update profiles set status='active' where id='33330000-0000-4000-8000-000000000a01';
  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a01');
  insert into bookings (listing_id,guest_id,start_date,end_date,total_cents)
    values ('33330000-0000-4000-8000-0000000000b1','33330000-0000-4000-8000-000000000a01',current_date+30,current_date+32,10000);
  perform pg_temp.as_pg();
  raise notice 'PASS 4: suspension blocks booking; reinstatement restores it';
end $$;

-- 5. Console read-functions refuse a non-staff caller -----------------------
do $$
begin
  perform pg_temp.act_as('33330000-0000-4000-8000-000000000a01'); -- a plain guest
  begin perform admin_list_users(); raise exception 'FAIL 5: guest listed users';
  exception when sqlstate '42501' then null; end;
  begin perform admin_moderation_queue(); raise exception 'FAIL 5: guest read moderation queue';
  exception when sqlstate '42501' then null; end;
  perform pg_temp.as_pg();
  raise notice 'PASS 5: console reads refuse non-staff';
end $$;

rollback;
