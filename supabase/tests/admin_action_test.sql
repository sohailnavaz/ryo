-- The single privileged write path. (migration 0005/0008)
--
-- admin_action() must hold every guarantee for every action: only staff, reason
-- required + scoped, idempotent, dry-run writes nothing, four-eyes above threshold,
-- self-action refused, hash-chained tamper-evident audit. Self-contained + rollback.

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('22220000-0000-4000-8000-000000000a01','00000000-0000-0000-0000-000000000000','authenticated','authenticated','aa-admin@test','x',now(),'{}','{"full_name":"Admin"}',now(),now()),
 ('22220000-0000-4000-8000-000000000a02','00000000-0000-0000-0000-000000000000','authenticated','authenticated','aa-admin2@test','x',now(),'{}','{"full_name":"Admin2"}',now(),now()),
 ('22220000-0000-4000-8000-000000000a03','00000000-0000-0000-0000-000000000000','authenticated','authenticated','aa-host@test','x',now(),'{}','{"full_name":"Host"}',now(),now());
update profiles set role='admin' where id in ('22220000-0000-4000-8000-000000000a01','22220000-0000-4000-8000-000000000a02');
update profiles set role='host'  where id='22220000-0000-4000-8000-000000000a03';

create or replace function pg_temp.act_as(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',p::text,'role','authenticated')::text, true);
      perform set_config('role','authenticated', true); end $$;
create or replace function pg_temp.as_pg() returns void language plpgsql as $$ begin reset role; end $$;

-- 1. Non-staff is refused ---------------------------------------------------
do $$
begin
  perform pg_temp.act_as('22220000-0000-4000-8000-000000000a03'); -- a host
  begin
    perform admin_action('user.suspend','user','22220000-0000-4000-8000-000000000a03','FRAUD_SUSPECTED');
    raise exception 'FAIL 1: non-staff acted';
  exception when sqlstate '42501' then null; end;
  perform pg_temp.as_pg();
  raise notice 'PASS 1: non-staff refused';
end $$;

-- 2. Dry run computes blast radius but writes nothing -----------------------
do $$
declare res jsonb; before bigint;
begin
  select count(*) into before from audit_log;
  perform pg_temp.act_as('22220000-0000-4000-8000-000000000a01');
  res := admin_action('user.suspend','user','22220000-0000-4000-8000-000000000a03','FRAUD_SUSPECTED',null,'{}'::jsonb,null,true);
  perform pg_temp.as_pg();
  if (res->>'dry_run')::boolean is not true then raise exception 'FAIL 2: not a dry run'; end if;
  if (select count(*) from audit_log) <> before then raise exception 'FAIL 2: dry run wrote an audit row'; end if;
  raise notice 'PASS 2: dry run writes nothing';
end $$;

-- 3. Reason code required + scoped to the subject ---------------------------
do $$
declare err text;
begin
  perform pg_temp.act_as('22220000-0000-4000-8000-000000000a01');
  begin
    perform admin_action('user.suspend','user','22220000-0000-4000-8000-000000000a03', null);
    raise exception 'FAIL 3: no reason accepted';
  exception when sqlstate '22023' then
    get stacked diagnostics err = message_text;
    if err not like '%REASON_REQUIRED%' then raise exception 'FAIL 3a: %', err; end if; end;
  begin
    perform admin_action('user.suspend','user','22220000-0000-4000-8000-000000000a03','QUALITY_BAR'); -- a listing reason
    raise exception 'FAIL 3: listing reason accepted for a user action';
  exception when sqlstate '22023' then
    get stacked diagnostics err = message_text;
    if err not like '%REASON_INVALID%' then raise exception 'FAIL 3b: %', err; end if; end;
  perform pg_temp.as_pg();
  raise notice 'PASS 3: reason required + scoped';
end $$;

-- 4. Suspend applies + audits + emits an event, all in one action -----------
do $$
declare res jsonb; st text;
begin
  perform pg_temp.act_as('22220000-0000-4000-8000-000000000a01');
  res := admin_action('user.suspend','user','22220000-0000-4000-8000-000000000a03','FRAUD_SUSPECTED','card testing','{}'::jsonb,'aa-idem-1',false);
  perform pg_temp.as_pg();
  if res->>'status' <> 'applied' then raise exception 'FAIL 4: status %', res->>'status'; end if;
  select status into st from profiles where id='22220000-0000-4000-8000-000000000a03';
  if st<>'suspended' then raise exception 'FAIL 4: not suspended'; end if;
  if not exists (select 1 from audit_log where idempotency_key='aa-idem-1' and action='user.suspend') then
    raise exception 'FAIL 4: no audit row'; end if;
  if not exists (select 1 from events where name='user.suspend' and source='admin') then
    raise exception 'FAIL 4: no event'; end if;
  raise notice 'PASS 4: suspend applies + audits + events atomically';
end $$;

-- 5. Idempotency: a retry with the same key never acts twice -----------------
do $$
declare res jsonb; n bigint;
begin
  perform pg_temp.act_as('22220000-0000-4000-8000-000000000a01');
  res := admin_action('user.suspend','user','22220000-0000-4000-8000-000000000a03','FRAUD_SUSPECTED','card testing','{}'::jsonb,'aa-idem-1',false);
  perform pg_temp.as_pg();
  if (res->>'replayed')::boolean is not true then raise exception 'FAIL 5: not flagged replayed'; end if;
  select count(*) into n from audit_log where idempotency_key='aa-idem-1';
  if n<>1 then raise exception 'FAIL 5: replay wrote a second row (%)', n; end if;
  raise notice 'PASS 5: idempotent replay never acts twice';
end $$;

-- 6. An operator cannot suspend their own account ---------------------------
do $$
begin
  perform pg_temp.act_as('22220000-0000-4000-8000-000000000a01');
  begin
    perform admin_action('user.suspend','user','22220000-0000-4000-8000-000000000a01','FRAUD_SUSPECTED');
    raise exception 'FAIL 6: self-suspend allowed';
  exception when sqlstate '42501' then null; end;
  perform pg_temp.as_pg();
  raise notice 'PASS 6: cannot act on your own account';
end $$;

-- 7. Four-eyes: a role grant is held for a second approver ------------------
do $$
declare res jsonb; role1 text;
begin
  perform pg_temp.act_as('22220000-0000-4000-8000-000000000a01');
  res := admin_action('user.grant_role','user','22220000-0000-4000-8000-000000000a03','ROLE_ONBOARDING','promote','{"role":"staff"}'::jsonb,null,false);
  perform pg_temp.as_pg();
  if res->>'status' <> 'pending_approval' then raise exception 'FAIL 7: status %', res->>'status'; end if;
  select role into role1 from profiles where id='22220000-0000-4000-8000-000000000a03';
  if role1 <> 'host' then raise exception 'FAIL 7: role changed before approval (%)', role1; end if;
  raise notice 'PASS 7: four-eyes holds a role grant';
end $$;

-- 8. The audit log is hash-chained + append-only ----------------------------
do $$
declare broken int; err text;
begin
  select count(*) into broken from verify_audit_chain();
  if broken<>0 then raise exception 'FAIL 8: chain broken at % rows', broken; end if;
  begin
    update audit_log set note='tampered' where seq=(select min(seq) from audit_log);
    raise exception 'FAIL 8: audit log editable';
  exception when sqlstate '42501' then
    get stacked diagnostics err = message_text;
    if err not like '%AUDIT_LOG_IMMUTABLE%' then raise exception 'FAIL 8: %', err; end if; end;
  raise notice 'PASS 8: audit chain intact + append-only';
end $$;

rollback;
