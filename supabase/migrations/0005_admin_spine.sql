-- 0005_admin_spine.sql — Phase 0 of the admin console (docs/15-admin-console.md §5).
--
-- This migration has no visible output and everything else depends on it.
--
-- It establishes:
--   1. The state columns the console's actions actually write to (profiles.status,
--      listings.moderation_status, reviews.status) — these did not exist, which is
--      why every admin action to date lived in localStorage.
--   2. `events`        — the analytics spine. Append-only facts, partitioned by month.
--   3. `audit_log`     — governance. Hash-chained (tamper-evident), never deleted.
--   4. `reason_codes`  — canonical reasons; every privileged action cites one.
--   5. `approvals`     — four-eyes for high-impact actions.
--   6. `admin_action()` — THE single write path. Permission check → idempotency replay
--      → blast radius → dry-run → four-eyes → state change → audit → event, all in one
--      transaction (a plpgsql function is atomic; a sequence of PostgREST calls is not).
--
-- Design note: `admin_action()` is SECURITY DEFINER and is the *only* way to perform a
-- privileged write. No staff RLS write policies are added to profiles/listings/reviews/
-- bookings on purpose — so there is no second path, and "the client hides the button,
-- the database refuses the write" is literally true.

-- Hashing uses the built-in sha256(bytea) (Postgres 11+), NOT pgcrypto's digest():
-- on Supabase pgcrypto lives in the `extensions` schema, so a function pinned to
-- `search_path = public` cannot see digest(). The built-in has no such problem and
-- removes an extension dependency.

-- ---------------------------------------------------------------------------
-- 1. State columns the console acts on
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended')),
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text;

create index if not exists profiles_status_idx on public.profiles (status)
  where status <> 'active';

-- Existing listings are live; new ones land in 'approved' until the moderation
-- queue is switched to gate publication (Phase 2).
alter table public.listings
  add column if not exists moderation_status text not null default 'approved'
    check (moderation_status in ('pending', 'approved', 'changes_requested', 'rejected')),
  add column if not exists moderated_at timestamptz,
  add column if not exists moderation_note text;

create index if not exists listings_moderation_idx on public.listings (moderation_status)
  where moderation_status <> 'approved';

alter table public.reviews
  add column if not exists status text not null default 'visible'
    check (status in ('visible', 'removed'));

create index if not exists reviews_status_idx on public.reviews (status)
  where status <> 'visible';

-- ---------------------------------------------------------------------------
-- 2. reason_codes — a privileged action without a reason is not auditable
-- ---------------------------------------------------------------------------

create table if not exists public.reason_codes (
  code        text primary key,
  applies_to  text not null,              -- action prefix: 'user' | 'listing' | 'review' | 'booking'
  label       text not null,
  description text not null default '',
  active      boolean not null default true
);

insert into public.reason_codes (code, applies_to, label, description) values
  ('FRAUD_SUSPECTED',     'user',    'Fraud suspected',        'Payment or identity fraud signals'),
  ('POLICY_VIOLATION',    'user',    'Policy violation',       'Breached community or platform policy'),
  ('ABUSIVE_CONDUCT',     'user',    'Abusive conduct',        'Harassment or abuse toward guests, hosts or staff'),
  ('SPAM',                'user',    'Spam',                   'Automated or bulk unsolicited activity'),
  ('USER_REQUESTED',      'user',    'User requested',         'Account holder asked for this'),
  ('APPEAL_UPHELD',       'user',    'Appeal upheld',          'Reinstated after review of an appeal'),
  ('MISTAKE_CORRECTED',   'user',    'Staff error corrected',  'Action was taken in error'),
  ('ROLE_ONBOARDING',     'user',    'Onboarding a teammate',  'New staff member joining — granting their working role'),
  ('ROLE_CHANGE',         'user',    'Responsibilities changed','Existing teammate moving to a different role'),
  ('ROLE_REVOKED',        'user',    'Access revoked',         'Teammate left, or scope reduced'),
  ('QUALITY_BAR',         'listing', 'Below quality bar',      'Photos, description or accuracy below standard'),
  ('INACCURATE_LISTING',  'listing', 'Inaccurate',             'Listing misrepresents the property'),
  ('PROHIBITED_PROPERTY', 'listing', 'Prohibited property',    'Property type not permitted on Ryo'),
  ('DUPLICATE_LISTING',   'listing', 'Duplicate',              'Same property already listed'),
  ('MEETS_STANDARD',      'listing', 'Meets standard',         'Approved — meets the listing quality bar'),
  ('OFF_TOPIC',           'review',  'Off topic',              'Review not about the stay'),
  ('PERSONAL_INFO',       'review',  'Contains personal info', 'Exposes PII'),
  ('HATE_OR_ABUSE',       'review',  'Hate or abuse',          'Abusive content'),
  ('FAKE_REVIEW',         'review',  'Fake / incentivised',    'Not from a verified stay'),
  ('REVIEW_UPHELD',       'review',  'Upheld after review',    'Flagged but within policy — kept'),
  ('HOST_CANCELLED',      'booking', 'Host cancelled',         'Host could not honour the booking'),
  ('GUEST_REQUESTED',     'booking', 'Guest requested',        'Guest asked to cancel'),
  ('SAFETY_CONCERN',      'booking', 'Safety concern',         'Cancelled on trust & safety grounds'),
  ('PROPERTY_UNAVAILABLE','booking', 'Property unavailable',   'Property genuinely not available')
on conflict (code) do nothing;

alter table public.reason_codes enable row level security;

create policy "reason_codes staff read"
  on public.reason_codes for select
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- 3. events — the analytics spine (append-only, partitioned by month)
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id           bigserial,
  occurred_at  timestamptz not null default now(),
  name         text not null,            -- 'booking.confirmed' — noun.past_tense, never renamed
  actor_id     uuid,
  actor_role   text,
  subject_type text,
  subject_id   text,
  payload      jsonb not null default '{}'::jsonb,
  source       text not null default 'web'
    check (source in ('web', 'mobile', 'server', 'admin', 'system')),
  session_id   text,
  request_id   text,
  primary key (id, occurred_at)
) partition by range (occurred_at);

-- A default partition means an event is never lost to a missing partition; the
-- monthly ones keep the hot range small. `ensure_events_partition()` is called
-- by a monthly job (pg_cron) to roll the window forward.
create table if not exists public.events_default partition of public.events default;

create or replace function public.ensure_events_partition(p_months_ahead int default 3)
returns void
language plpgsql
as $$
declare
  v_start date;
  v_end   date;
  v_name  text;
  i       int;
begin
  for i in 0..p_months_ahead loop
    v_start := date_trunc('month', current_date)::date + (i || ' months')::interval;
    v_end   := (v_start + interval '1 month')::date;
    v_name  := 'events_' || to_char(v_start, 'YYYY_MM');
    if not exists (select 1 from pg_class where relname = v_name) then
      execute format(
        'create table public.%I partition of public.events for values from (%L) to (%L)',
        v_name, v_start, v_end
      );
    end if;
  end loop;
end;
$$;

select public.ensure_events_partition(3);

create index if not exists events_name_time_idx    on public.events (name, occurred_at desc);
create index if not exists events_subject_idx      on public.events (subject_type, subject_id, occurred_at desc);
create index if not exists events_actor_idx        on public.events (actor_id, occurred_at desc);

alter table public.events enable row level security;

-- Staff read the spine. Nobody writes to it directly — `record_event()` does.
create policy "events staff read"
  on public.events for select
  using (public.is_staff());

-- Events are facts, so the actor is stamped from the JWT, never accepted from the
-- caller. A client that claims to be someone else is simply recorded as itself.
create or replace function public.record_event(
  p_name         text,
  p_subject_type text default null,
  p_subject_id   text default null,
  p_payload      jsonb default '{}'::jsonb,
  p_source       text default 'web',
  p_session_id   text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role  text;
begin
  if p_name !~ '^[a-z_]+\.[a-z_]+$' then
    raise exception 'EVENT_NAME_INVALID: % (expected noun.past_tense)', p_name
      using errcode = '22023';
  end if;

  select role into v_role from public.profiles where id = v_actor;

  insert into public.events (name, actor_id, actor_role, subject_type, subject_id, payload, source, session_id)
  values (p_name, v_actor, v_role, p_subject_type, p_subject_id, coalesce(p_payload, '{}'::jsonb),
          coalesce(p_source, 'web'), p_session_id);
end;
$$;

grant execute on function public.record_event(text, text, text, jsonb, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. audit_log — governance. Hash-chained so it is evidence, not a list.
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  seq             bigserial unique,
  actor_id        uuid not null references public.profiles(id),
  actor_role      text not null,
  action          text not null,
  subject_type    text not null,
  subject_id      text not null,
  reason_code     text references public.reason_codes(code),
  note            text,
  before          jsonb,
  after           jsonb,
  blast_radius    jsonb,
  result          jsonb,
  idempotency_key text unique,
  prev_hash       text not null,
  hash            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists audit_log_subject_idx on public.audit_log (subject_type, subject_id, created_at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id, created_at desc);
create index if not exists audit_log_action_idx  on public.audit_log (action, created_at desc);

-- The chain. Anyone who edits a historical row breaks every hash after it, and
-- `verify_audit_chain()` (nightly) finds them. The advisory lock serialises the
-- read-previous/write-next pair so concurrent actions cannot fork the chain.
-- The canonical serialisation of an audit row. Defined once so the writer (the
-- trigger) and the verifier can never disagree — if they did, every row would look
-- tampered and the chain would be useless.
create or replace function public.audit_row_hash(
  p_seq          bigint,
  p_actor_id     uuid,
  p_action       text,
  p_subject_type text,
  p_subject_id   text,
  p_reason_code  text,
  p_before       jsonb,
  p_after        jsonb,
  p_created_at   timestamptz,
  p_prev_hash    text
) returns text
language sql
immutable
as $$
  select encode(
    sha256(convert_to(
      p_seq::text || '|' || p_actor_id::text || '|' || p_action || '|' ||
      p_subject_type || '|' || p_subject_id || '|' ||
      coalesce(p_reason_code, '') || '|' ||
      coalesce(p_before::text, '') || '|' || coalesce(p_after::text, '') || '|' ||
      p_created_at::text || '|' || p_prev_hash,
      'UTF8'
    )),
    'hex'
  );
$$;

create or replace function public.audit_log_chain()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_prev text;
begin
  perform pg_advisory_xact_lock(hashtext('ryo.audit_log'));

  select hash into v_prev from public.audit_log order by seq desc limit 1;
  v_prev := coalesce(v_prev, repeat('0', 64));

  new.prev_hash := v_prev;
  new.hash := public.audit_row_hash(
    new.seq, new.actor_id, new.action, new.subject_type, new.subject_id,
    new.reason_code, new.before, new.after, new.created_at, v_prev
  );
  return new;
end;
$$;

drop trigger if exists audit_log_chain_trg on public.audit_log;
create trigger audit_log_chain_trg
  before insert on public.audit_log
  for each row execute function public.audit_log_chain();

-- Append-only: no updates, no deletes, ever. Not even for staff.
create or replace function public.audit_log_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'AUDIT_LOG_IMMUTABLE: the audit log is append-only'
    using errcode = '42501';
end;
$$;

drop trigger if exists audit_log_immutable_trg on public.audit_log;
create trigger audit_log_immutable_trg
  before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

create or replace function public.verify_audit_chain()
returns table (broken_at bigint, expected text, found text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r        record;
  v_prev   text := repeat('0', 64);
  v_expect text;
begin
  for r in select * from public.audit_log order by seq asc loop
    v_expect := public.audit_row_hash(
      r.seq, r.actor_id, r.action, r.subject_type, r.subject_id,
      r.reason_code, r.before, r.after, r.created_at, v_prev
    );
    if v_expect <> r.hash or r.prev_hash <> v_prev then
      broken_at := r.seq; expected := v_expect; found := r.hash;
      return next;
    end if;
    v_prev := r.hash;
  end loop;
end;
$$;

alter table public.audit_log enable row level security;

create policy "audit_log staff read"
  on public.audit_log for select
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- 5. The action registry + four-eyes approvals
-- ---------------------------------------------------------------------------

-- Thresholds live as data, so tightening the four-eyes rule is an UPDATE, not a deploy.
create table if not exists public.admin_actions_registry (
  action                   text primary key,
  label                    text not null,
  subject_type             text not null,
  requires_reason          boolean not null default true,
  admin_only               boolean not null default false,  -- 'admin' role, not merely 'staff'
  approval_threshold_cents bigint,                          -- null = never needs a second approver
  undo_window_minutes      int,                             -- null = irreversible
  enabled                  boolean not null default true,   -- false = specced but its backing system isn't built
  disabled_reason          text
);

insert into public.admin_actions_registry
  (action, label, subject_type, admin_only, approval_threshold_cents, undo_window_minutes, enabled, disabled_reason) values
  ('user.suspend',            'Suspend user',        'user',    false, null,   60,   true,  null),
  ('user.reinstate',          'Reinstate user',      'user',    false, null,   null, true,  null),
  ('user.grant_role',         'Grant role',          'user',    true,  0,      null, true,  null),
  ('listing.approve',         'Approve listing',     'listing', false, null,   null, true,  null),
  ('listing.request_changes', 'Request changes',     'listing', false, null,   null, true,  null),
  ('listing.reject',          'Reject listing',      'listing', false, null,   60,   true,  null),
  ('review.remove',           'Remove review',       'review',  false, null,   60,   true,  null),
  ('review.restore',          'Restore review',      'review',  false, null,   null, true,  null),
  ('booking.cancel',          'Cancel booking',      'booking', false, null,   60,   true,  null),
  ('booking.refund',          'Refund booking',      'booking', false, 2500000, null, false,
     'Refunds need the double-entry ledger (docs/15 §6.5, Phase 3). Cancelling is available; money movement is not.')
on conflict (action) do nothing;

alter table public.admin_actions_registry enable row level security;

create policy "registry staff read"
  on public.admin_actions_registry for select
  using (public.is_staff());

create table if not exists public.approvals (
  id              uuid primary key default gen_random_uuid(),
  action          text not null references public.admin_actions_registry(action),
  subject_type    text not null,
  subject_id      text not null,
  payload         jsonb not null default '{}'::jsonb,
  reason_code     text references public.reason_codes(code),
  note            text,
  requested_by    uuid not null references public.profiles(id),
  requested_at    timestamptz not null default now(),
  status          text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'consumed', 'expired')),
  decided_by      uuid references public.profiles(id),
  decided_at      timestamptz,
  decision_note   text,
  expires_at      timestamptz not null default now() + interval '24 hours'
);

create index if not exists approvals_pending_idx on public.approvals (status, requested_at desc)
  where status = 'pending';

alter table public.approvals enable row level security;

create policy "approvals staff read"
  on public.approvals for select
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- 6. Blast radius — what a destructive action would actually touch.
--    Called by dry-run BEFORE anything is written, and stored on the audit row.
-- ---------------------------------------------------------------------------

create or replace function public.admin_blast_radius(
  p_action       text,
  p_subject_type text,
  p_subject_id   text
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_bookings int    := 0;
  v_value    bigint := 0;
  v_listings int    := 0;
  v_guests   int    := 0;
begin
  if p_action in ('user.suspend') then
    select count(*) into v_listings
      from listings where host_id = p_subject_id::uuid;

    -- Upcoming bookings the suspension would put at risk: as guest, plus every
    -- upcoming booking on any listing they host.
    select count(*), coalesce(sum(b.total_cents), 0), count(distinct b.guest_id)
      into v_bookings, v_value, v_guests
      from bookings b
      left join listings l on l.id = b.listing_id
     where b.status = 'confirmed'
       and b.start_date >= current_date
       and (b.guest_id = p_subject_id::uuid or l.host_id = p_subject_id::uuid);

    return jsonb_build_object(
      'listings_affected',        v_listings,
      'upcoming_bookings',        v_bookings,
      'upcoming_booking_value_cents', v_value,
      'guests_notified',          v_guests
    );

  elsif p_action in ('listing.reject', 'listing.request_changes') then
    select count(*), coalesce(sum(total_cents), 0), count(distinct guest_id)
      into v_bookings, v_value, v_guests
      from bookings
     where listing_id = p_subject_id::uuid
       and status = 'confirmed'
       and start_date >= current_date;

    return jsonb_build_object(
      'upcoming_bookings',             v_bookings,
      'upcoming_booking_value_cents',  v_value,
      'guests_notified',               v_guests
    );

  elsif p_action = 'booking.cancel' then
    select 1, total_cents, 1 into v_bookings, v_value, v_guests
      from bookings where id = p_subject_id::uuid;

    return jsonb_build_object(
      'upcoming_bookings',            coalesce(v_bookings, 0),
      'upcoming_booking_value_cents', coalesce(v_value, 0),
      'guests_notified',              coalesce(v_guests, 0)
    );
  end if;

  return jsonb_build_object('upcoming_bookings', 0, 'upcoming_booking_value_cents', 0, 'guests_notified', 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. admin_action() — THE write path.
--
-- Permission → idempotency replay → blast radius → dry-run → four-eyes →
-- state change → audit (hash-chained) → event. One transaction; all or nothing.
-- ---------------------------------------------------------------------------

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
  v_before   jsonb;
  v_after    jsonb;
  v_amount   bigint := coalesce((p_payload->>'amount_cents')::bigint, 0);
  v_needs_approval boolean := false;
  v_approval uuid;
  v_audit_id uuid;
  v_result   jsonb;
  v_new_role text;
begin
  ---------------------------------------------------------------------------
  -- 1. Who is asking, and are they allowed to ask?
  ---------------------------------------------------------------------------
  if v_actor is null then
    raise exception 'ADMIN_ACTION_UNAUTHENTICATED' using errcode = '42501';
  end if;

  select role into v_role from profiles where id = v_actor;

  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  ---------------------------------------------------------------------------
  -- 2. Is this a known, enabled action?
  ---------------------------------------------------------------------------
  select * into v_reg from admin_actions_registry where action = p_action;

  if not found then
    raise exception 'ADMIN_ACTION_UNKNOWN: %', p_action using errcode = '22023';
  end if;

  if not v_reg.enabled then
    raise exception 'ADMIN_ACTION_NOT_ENABLED: % — %', p_action, coalesce(v_reg.disabled_reason, 'not yet built')
      using errcode = '22023';
  end if;

  if v_reg.admin_only and v_role <> 'admin' then
    raise exception 'ADMIN_ACTION_FORBIDDEN: % requires the admin role', p_action
      using errcode = '42501';
  end if;

  if v_reg.subject_type <> p_subject_type then
    raise exception 'ADMIN_ACTION_SUBJECT_MISMATCH: % acts on %, got %',
      p_action, v_reg.subject_type, p_subject_type using errcode = '22023';
  end if;

  ---------------------------------------------------------------------------
  -- 3. Reason code — required, valid, and applicable to this action's subject
  ---------------------------------------------------------------------------
  if v_reg.requires_reason then
    if p_reason_code is null then
      raise exception 'ADMIN_ACTION_REASON_REQUIRED: % needs a reason code', p_action
        using errcode = '22023';
    end if;
    if not exists (
      select 1 from reason_codes
       where code = p_reason_code and active and applies_to = v_reg.subject_type
    ) then
      raise exception 'ADMIN_ACTION_REASON_INVALID: % is not a valid reason for a % action',
        p_reason_code, v_reg.subject_type using errcode = '22023';
    end if;
  end if;

  ---------------------------------------------------------------------------
  -- 4. Idempotency — a double-click, a retry, or a flaky network never acts twice
  ---------------------------------------------------------------------------
  if p_idempotency_key is not null then
    select result into v_prior from audit_log where idempotency_key = p_idempotency_key;
    if v_prior is not null then
      return v_prior || jsonb_build_object('replayed', true);
    end if;
  end if;

  ---------------------------------------------------------------------------
  -- 5. Blast radius — computed before anything is written
  ---------------------------------------------------------------------------
  v_radius := admin_blast_radius(p_action, p_subject_type, p_subject_id);

  v_needs_approval := v_reg.approval_threshold_cents is not null
                      and v_amount >= v_reg.approval_threshold_cents;

  ---------------------------------------------------------------------------
  -- 6. Dry run — tell the operator what this would do, write nothing
  ---------------------------------------------------------------------------
  if p_dry_run then
    return jsonb_build_object(
      'dry_run',           true,
      'action',            p_action,
      'label',             v_reg.label,
      'subject_type',      p_subject_type,
      'subject_id',        p_subject_id,
      'blast_radius',      v_radius,
      'requires_approval', v_needs_approval,
      'undo_window_minutes', v_reg.undo_window_minutes
    );
  end if;

  ---------------------------------------------------------------------------
  -- 7. Four-eyes — above the threshold, someone else must have said yes
  ---------------------------------------------------------------------------
  if v_needs_approval then
    select id into v_approval
      from approvals
     where action = p_action
       and subject_id = p_subject_id
       and status = 'approved'
       and decided_by <> v_actor          -- you cannot approve your own action
       and expires_at > now()
     order by decided_at desc
     limit 1;

    if v_approval is null then
      insert into approvals (action, subject_type, subject_id, payload, reason_code, note, requested_by)
      values (p_action, p_subject_type, p_subject_id, p_payload, p_reason_code, p_note, v_actor)
      returning id into v_approval;

      return jsonb_build_object(
        'status',       'pending_approval',
        'approval_id',  v_approval,
        'action',       p_action,
        'blast_radius', v_radius,
        'message',      'This action needs a second approver.'
      );
    end if;

    update approvals set status = 'consumed' where id = v_approval;
  end if;

  ---------------------------------------------------------------------------
  -- 8. Apply the state change
  ---------------------------------------------------------------------------
  case p_action

    when 'user.suspend' then
      select to_jsonb(p) - 'avatar_url' into v_before from profiles p where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: user %', p_subject_id using errcode = '22023';
      end if;
      update profiles
         set status = 'suspended', suspended_at = now(), suspended_reason = p_reason_code
       where id = p_subject_id::uuid;
      select to_jsonb(p) - 'avatar_url' into v_after from profiles p where id = p_subject_id::uuid;

    when 'user.reinstate' then
      select to_jsonb(p) - 'avatar_url' into v_before from profiles p where id = p_subject_id::uuid;
      update profiles
         set status = 'active', suspended_at = null, suspended_reason = null
       where id = p_subject_id::uuid;
      select to_jsonb(p) - 'avatar_url' into v_after from profiles p where id = p_subject_id::uuid;

    when 'user.grant_role' then
      v_new_role := p_payload->>'role';
      if v_new_role is null or v_new_role not in ('guest', 'host', 'staff', 'admin') then
        raise exception 'ADMIN_ACTION_INVALID_PAYLOAD: role must be guest|host|staff|admin'
          using errcode = '22023';
      end if;
      select jsonb_build_object('role', role) into v_before from profiles where id = p_subject_id::uuid;
      update profiles set role = v_new_role where id = p_subject_id::uuid;
      select jsonb_build_object('role', role) into v_after from profiles where id = p_subject_id::uuid;

    when 'listing.approve' then
      select jsonb_build_object('moderation_status', moderation_status) into v_before
        from listings where id = p_subject_id::uuid;
      update listings
         set moderation_status = 'approved', moderated_at = now(), moderation_note = p_note
       where id = p_subject_id::uuid;
      select jsonb_build_object('moderation_status', moderation_status) into v_after
        from listings where id = p_subject_id::uuid;

    when 'listing.request_changes' then
      select jsonb_build_object('moderation_status', moderation_status) into v_before
        from listings where id = p_subject_id::uuid;
      update listings
         set moderation_status = 'changes_requested', moderated_at = now(), moderation_note = p_note
       where id = p_subject_id::uuid;
      select jsonb_build_object('moderation_status', moderation_status) into v_after
        from listings where id = p_subject_id::uuid;

    when 'listing.reject' then
      select jsonb_build_object('moderation_status', moderation_status) into v_before
        from listings where id = p_subject_id::uuid;
      update listings
         set moderation_status = 'rejected', moderated_at = now(), moderation_note = p_note
       where id = p_subject_id::uuid;
      select jsonb_build_object('moderation_status', moderation_status) into v_after
        from listings where id = p_subject_id::uuid;

    when 'review.remove' then
      select jsonb_build_object('status', status) into v_before from reviews where id = p_subject_id::uuid;
      update reviews set status = 'removed' where id = p_subject_id::uuid;
      select jsonb_build_object('status', status) into v_after from reviews where id = p_subject_id::uuid;

    when 'review.restore' then
      select jsonb_build_object('status', status) into v_before from reviews where id = p_subject_id::uuid;
      update reviews set status = 'visible' where id = p_subject_id::uuid;
      select jsonb_build_object('status', status) into v_after from reviews where id = p_subject_id::uuid;

    when 'booking.cancel' then
      select jsonb_build_object('status', status, 'total_cents', total_cents) into v_before
        from bookings where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: booking %', p_subject_id using errcode = '22023';
      end if;
      update bookings set status = 'cancelled' where id = p_subject_id::uuid;
      select jsonb_build_object('status', status, 'total_cents', total_cents) into v_after
        from bookings where id = p_subject_id::uuid;

    else
      raise exception 'ADMIN_ACTION_UNHANDLED: % is registered but has no handler', p_action
        using errcode = '22023';
  end case;

  ---------------------------------------------------------------------------
  -- 9. Audit (hash-chained) + event — same transaction as the state change
  ---------------------------------------------------------------------------
  v_result := jsonb_build_object(
    'status',       'applied',
    'action',       p_action,
    'subject_type', p_subject_type,
    'subject_id',   p_subject_id,
    'before',       v_before,
    'after',        v_after,
    'blast_radius', v_radius,
    'undo_until',   case when v_reg.undo_window_minutes is not null
                         then to_jsonb(now() + (v_reg.undo_window_minutes || ' minutes')::interval)
                         else 'null'::jsonb end
  );

  insert into audit_log (
    actor_id, actor_role, action, subject_type, subject_id,
    reason_code, note, before, after, blast_radius, result, idempotency_key
  ) values (
    v_actor, v_role, p_action, p_subject_type, p_subject_id,
    p_reason_code, p_note, v_before, v_after, v_radius, v_result, p_idempotency_key
  ) returning id into v_audit_id;

  insert into events (name, actor_id, actor_role, subject_type, subject_id, payload, source)
  values (
    p_action, v_actor, v_role, p_subject_type, p_subject_id,
    jsonb_build_object('reason_code', p_reason_code, 'audit_id', v_audit_id, 'blast_radius', v_radius),
    'admin'
  );

  return v_result || jsonb_build_object('audit_id', v_audit_id);
end;
$$;

revoke all on function public.admin_action(text, text, text, text, text, jsonb, text, boolean) from public, anon;
grant execute on function public.admin_action(text, text, text, text, text, jsonb, text, boolean) to authenticated;

revoke all on function public.admin_blast_radius(text, text, text) from public, anon;
grant execute on function public.admin_blast_radius(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Approval decisions (the second pair of eyes)
-- ---------------------------------------------------------------------------

create or replace function public.decide_approval(
  p_approval_id uuid,
  p_approve     boolean,
  p_note        text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role  text;
  v_appr  public.approvals%rowtype;
begin
  select role into v_role from profiles where id = v_actor;
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_appr from approvals where id = p_approval_id;
  if not found then
    raise exception 'APPROVAL_NOT_FOUND' using errcode = '22023';
  end if;
  if v_appr.requested_by = v_actor then
    raise exception 'APPROVAL_SELF: you cannot approve an action you requested'
      using errcode = '42501';
  end if;
  if v_appr.status <> 'pending' then
    raise exception 'APPROVAL_ALREADY_DECIDED: %', v_appr.status using errcode = '22023';
  end if;

  update approvals
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_by = v_actor, decided_at = now(), decision_note = p_note
   where id = p_approval_id;

  insert into events (name, actor_id, actor_role, subject_type, subject_id, payload, source)
  values (
    case when p_approve then 'approval.granted' else 'approval.rejected' end,
    v_actor, v_role, 'approval', p_approval_id::text,
    jsonb_build_object('action', v_appr.action, 'subject_id', v_appr.subject_id),
    'admin'
  );

  return jsonb_build_object('status', case when p_approve then 'approved' else 'rejected' end);
end;
$$;

revoke all on function public.decide_approval(uuid, boolean, text) from public, anon;
grant execute on function public.decide_approval(uuid, boolean, text) to authenticated;
