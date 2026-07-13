-- 0008_console_real.sql — Phase 2 (docs/15-admin-console.md §10).
--
-- The console stops being localStorage theatre.
--
-- Until now every "live" admin action wrote to a browser-local override store
-- (`admin-store.ts`), so a suspension existed only on the machine that performed it
-- and vanished on a different device. Phase 0 built the real write path; Phase 1 gave
-- users a real list. This migration gives the rest of the console real DATA to read,
-- and real tables for the things that had none.
--
--   1. `admin_get_user()`        — real user inspector (fixes a broken link: the
--                                  Phase-1 list serves real uuids, but the inspector
--                                  was still looking them up in a synthetic seed).
--   2. `feature_flags`           — replaces the flag override store.
--   3. `incidents`/`incident_events` — the support→incident loop, for real.
--   4. `listing_calendar`        — host calendar overrides (host-calendar.ts already
--                                  detects this table and upgrades to it on its own).
--   5. `admin_moderation_queue()`, `admin_get_booking()`, `admin_list_audit()`.
--   6. New admin_action() handlers: incident.assign / incident.resolve / flag.toggle.

-- ---------------------------------------------------------------------------
-- 1. Feature flags
-- ---------------------------------------------------------------------------

create table if not exists public.feature_flags (
  key             text primary key,
  label           text not null,
  description     text not null default '',
  enabled         boolean not null default false,
  is_emergency    boolean not null default false,  -- kill switches: a note is mandatory
  rollout         jsonb not null default '{}'::jsonb,
  updated_by      uuid references public.profiles(id),
  updated_at      timestamptz not null default now()
);

insert into public.feature_flags (key, label, description, enabled, is_emergency) values
  ('concierge_ai',        'AI concierge',          'The streaming AI concierge on /concierge.', true,  false),
  ('instant_book',        'Instant book',          'Guests can book without host approval.',     true,  false),
  ('stories',             'Stories tab',           'The travel-content hub.',                     true,  false),
  ('reviews_write',       'Write a review',        'Guests can review after a completed stay.',   true,  false),
  ('booking_freeze',      'Freeze all bookings',   'Emergency: stop every new booking platform-wide.', false, true),
  ('signup_freeze',       'Freeze new signups',    'Emergency: stop new account creation.',       false, true),
  ('payout_freeze',       'Freeze host payouts',   'Emergency: hold every scheduled payout.',     false, true)
on conflict (key) do nothing;

alter table public.feature_flags enable row level security;

-- Everyone may READ a flag (the app has to know if it is on); only admin_action writes.
drop policy if exists "feature_flags read" on public.feature_flags;
create policy "feature_flags read"      on public.feature_flags for select using (true);

-- ---------------------------------------------------------------------------
-- 2. Incidents — the support→incident loop
-- ---------------------------------------------------------------------------

create table if not exists public.incidents (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid references public.profiles(id) on delete set null,
  booking_id  uuid references public.bookings(id) on delete set null,
  listing_id  uuid references public.listings(id) on delete set null,
  host_id     uuid references public.profiles(id) on delete set null,
  category    text not null,
  tier        int  not null check (tier in (1, 2, 3)),
  status      text not null default 'new'
    check (status in ('new', 'assigned', 'in_progress', 'resolved')),
  subject     text not null,
  detail      text not null default '',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists incidents_status_idx on public.incidents (status, tier, created_at desc);
create index if not exists incidents_guest_idx  on public.incidents (guest_id, created_at desc);
create index if not exists incidents_host_idx   on public.incidents (host_id, created_at desc);

create table if not exists public.incident_events (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  kind        text not null,
  body        text not null default '',
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_label text,
  created_at  timestamptz not null default now()
);

create index if not exists incident_events_idx on public.incident_events (incident_id, created_at);

alter table public.incidents       enable row level security;
alter table public.incident_events enable row level security;

-- A guest sees their own; a host sees incidents on their listings; staff see all.
drop policy if exists "incidents guest read own" on public.incidents;
create policy "incidents guest read own"  on public.incidents for select
  using (auth.uid() = guest_id);
drop policy if exists "incidents host read own" on public.incidents;
create policy "incidents host read own"   on public.incidents for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()));
drop policy if exists "incidents staff read all" on public.incidents;
create policy "incidents staff read all"  on public.incidents for select
  using (public.is_staff());
drop policy if exists "incidents guest insert own" on public.incidents;
create policy "incidents guest insert own" on public.incidents for insert
  with check (auth.uid() = guest_id);

drop policy if exists "incident_events read" on public.incident_events;
create policy "incident_events read" on public.incident_events for select
  using (
    public.is_staff()
    or exists (
      select 1 from public.incidents i
       where i.id = incident_id
         and (i.guest_id = auth.uid()
              or exists (select 1 from public.listings l where l.id = i.listing_id and l.host_id = auth.uid()))
    )
  );
drop policy if exists "incident_events guest insert" on public.incident_events;
create policy "incident_events guest insert" on public.incident_events for insert
  with check (
    exists (select 1 from public.incidents i where i.id = incident_id and i.guest_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3. listing_calendar — per-day host overrides (requested by L3 back in May)
-- ---------------------------------------------------------------------------

create table if not exists public.listing_calendar (
  listing_id  uuid not null references public.listings(id) on delete cascade,
  date        date not null,
  blocked     boolean,
  price_cents integer check (price_cents is null or price_cents >= 0),
  updated_at  timestamptz not null default now(),
  primary key (listing_id, date)
);

alter table public.listing_calendar enable row level security;

drop policy if exists "listing_calendar public read" on public.listing_calendar;
create policy "listing_calendar public read" on public.listing_calendar for select using (true);

drop policy if exists "listing_calendar host writes own" on public.listing_calendar;
create policy "listing_calendar host writes own" on public.listing_calendar for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. New privileged actions
-- ---------------------------------------------------------------------------

insert into public.admin_actions_registry
  (action, label, subject_type, requires_reason, admin_only, approval_threshold_cents, undo_window_minutes, enabled) values
  ('incident.assign',  'Assign incident',  'incident', false, false, null, null, true),
  ('incident.resolve', 'Resolve incident', 'incident', true,  false, null, 60,   true),
  ('flag.toggle',      'Toggle flag',      'flag',     true,  false, null, null, true)
on conflict (action) do nothing;

insert into public.reason_codes (code, applies_to, label, description) values
  ('RESOLVED_GUEST_HAPPY',  'incident', 'Resolved — guest satisfied', 'Guest confirmed the outcome'),
  ('RESOLVED_REFUNDED',     'incident', 'Resolved — refunded',        'Money returned to the guest'),
  ('RESOLVED_REBOOKED',     'incident', 'Resolved — rebooked',        'Guest moved to another home'),
  ('RESOLVED_NO_ACTION',    'incident', 'Resolved — no action needed','Not an incident on inspection'),
  ('DUPLICATE_INCIDENT',    'incident', 'Duplicate',                  'Already tracked elsewhere'),
  ('ROLLOUT',               'flag',     'Rolling out',                'Enabling as part of a planned rollout'),
  ('ROLLBACK',              'flag',     'Rolling back',               'Disabling — regression or bad metrics'),
  ('EMERGENCY',             'flag',     'Emergency',                  'Kill switch — incident in progress'),
  ('EXPERIMENT',            'flag',     'Experiment',                 'Toggled for a test')
on conflict (code) do nothing;

-- Extend the single write path with the new handlers. Everything else about
-- admin_action() (permission, idempotency, dry-run, four-eyes, audit, event) is
-- unchanged and applies to these for free — that is the point of having one door.
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
  v_enabled  boolean;
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

  -- An operator must not be able to lock themselves out of the console.
  if p_action in ('user.suspend', 'user.grant_role') and p_subject_id = v_actor::text then
    raise exception 'ADMIN_ACTION_FORBIDDEN: you cannot perform % on your own account', p_action
      using errcode = '42501';
  end if;

  -- Reason codes and the emergency-note rule are checked ONLY on a real commit.
  --
  -- They used to be checked before the dry-run early-return, which was backwards: a
  -- dry run exists precisely so the UI can show the blast radius *in the dialog that
  -- collects the reason*. Demanding the reason first made the preview impossible to
  -- call — found by clicking "Suspend…" in a browser, not by any type or unit check.
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

    -- An emergency kill-switch must be explained in words, not just a code.
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
      update bookings set status='cancelled' where id = p_subject_id::uuid;
      select jsonb_build_object('status', status, 'total_cents', total_cents) into v_after
        from bookings where id = p_subject_id::uuid;

    -- ---- new in 0008 -----------------------------------------------------
    when 'incident.assign' then
      select jsonb_build_object('status', status, 'assigned_to', assigned_to) into v_before
        from incidents where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: incident %', p_subject_id using errcode = '22023';
      end if;
      update incidents
         set assigned_to = coalesce((p_payload->>'assignee')::uuid, v_actor),
             status = case when status = 'new' then 'assigned' else status end,
             updated_at = now()
       where id = p_subject_id::uuid;
      select jsonb_build_object('status', status, 'assigned_to', assigned_to) into v_after
        from incidents where id = p_subject_id::uuid;
      insert into incident_events (incident_id, kind, body, actor_id, actor_label)
      values (p_subject_id::uuid, 'assigned', coalesce(p_note, 'Assigned'), v_actor, v_role);

    when 'incident.resolve' then
      select jsonb_build_object('status', status) into v_before
        from incidents where id = p_subject_id::uuid;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: incident %', p_subject_id using errcode = '22023';
      end if;
      update incidents set status='resolved', resolved_at=now(), updated_at=now()
       where id = p_subject_id::uuid;
      select jsonb_build_object('status', status) into v_after
        from incidents where id = p_subject_id::uuid;
      insert into incident_events (incident_id, kind, body, actor_id, actor_label)
      values (p_subject_id::uuid, 'resolved', coalesce(p_note, p_reason_code), v_actor, v_role);

    when 'flag.toggle' then
      select jsonb_build_object('enabled', enabled) into v_before
        from feature_flags where key = p_subject_id;
      if v_before is null then
        raise exception 'ADMIN_ACTION_SUBJECT_NOT_FOUND: flag %', p_subject_id using errcode = '22023';
      end if;
      v_enabled := coalesce((p_payload->>'enabled')::boolean, not (v_before->>'enabled')::boolean);
      update feature_flags set enabled = v_enabled, updated_by = v_actor, updated_at = now()
       where key = p_subject_id;
      select jsonb_build_object('enabled', enabled) into v_after
        from feature_flags where key = p_subject_id;

    else
      raise exception 'ADMIN_ACTION_UNHANDLED: % is registered but has no handler', p_action
        using errcode = '22023';
  end case;

  v_result := jsonb_build_object(
    'status', 'applied', 'action', p_action,
    'subject_type', p_subject_type, 'subject_id', p_subject_id,
    'before', v_before, 'after', v_after, 'blast_radius', v_radius,
    'undo_until', case when v_reg.undo_window_minutes is not null
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
  values (p_action, v_actor, v_role, p_subject_type, p_subject_id,
          jsonb_build_object('reason_code', p_reason_code, 'audit_id', v_audit_id, 'blast_radius', v_radius),
          'admin');

  return v_result || jsonb_build_object('audit_id', v_audit_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Real reads for the console
-- ---------------------------------------------------------------------------

-- The user inspector. Phase 1 made the list serve real uuids; without this the
-- inspector still looked them up in a synthetic seed and 404'd on every row.
create or replace function public.admin_get_user(p_id uuid, p_unmask boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_out  jsonb;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;
  if p_unmask and v_role <> 'admin' then
    raise exception 'ADMIN_ACTION_FORBIDDEN: unmasking requires the admin role' using errcode = '42501';
  end if;
  if p_unmask then
    perform record_event('pii.unmasked', 'user', p_id::text, '{}'::jsonb, 'admin', null);
  end if;

  select jsonb_build_object(
    'id',            u.id,
    'display_name',  u.display_name,
    'email',         case when p_unmask then u.email else mask_email(u.email) end,
    'email_masked',  not p_unmask,
    'role',          u.role,
    'status',        u.status,
    'created_at',    u.created_at,
    'suspended_at',  u.suspended_at,
    'suspended_reason', u.suspended_reason,
    'last_sign_in_at',  u.last_sign_in_at,
    'bookings_count', u.bookings_count,
    'ltv_cents',      u.ltv_cents,
    'nights',         u.nights,
    'listings_count', u.listings_count,

    'bookings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id, 'listing_title', l.title, 'start_date', b.start_date,
        'end_date', b.end_date, 'status', b.status,
        'total_cents', b.total_cents, 'currency', l.currency
      ) order by b.start_date desc)
      from bookings b join listings l on l.id = b.listing_id
      where b.guest_id = p_id
    ), '[]'::jsonb),

    'listings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'title', l.title, 'city', l.city,
        'moderation_status', l.moderation_status, 'price_cents', l.price_cents
      ) order by l.created_at desc)
      from listings l where l.host_id = p_id
    ), '[]'::jsonb),

    'incidents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'subject', i.subject, 'status', i.status,
        'tier', i.tier, 'created_at', i.created_at
      ) order by i.created_at desc)
      from incidents i where i.guest_id = p_id or i.host_id = p_id
    ), '[]'::jsonb),

    -- The fourth tab of every inspector: what staff have done to this record.
    'audit_trail', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'seq', a.seq, 'action', a.action, 'actor_role', a.actor_role,
        'actor_name', coalesce(ap.full_name, 'staff'),
        'reason_code', a.reason_code, 'note', a.note, 'created_at', a.created_at
      ) order by a.seq desc)
      from audit_log a left join profiles ap on ap.id = a.actor_id
      where a.subject_type = 'user' and a.subject_id = p_id::text
    ), '[]'::jsonb)
  ) into v_out
  from admin_users_v u where u.id = p_id;

  return v_out;   -- null when no such user; the caller renders "not found"
end;
$$;

revoke all on function public.admin_get_user(uuid, boolean) from public, anon;
grant execute on function public.admin_get_user(uuid, boolean) to authenticated;

-- The moderation queue: listings awaiting a decision + reviews that were removed or
-- are candidates for removal. Real rows, real ids, real actions.
create or replace function public.admin_moderation_queue()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'listings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'title', l.title, 'city', l.city, 'country', l.country,
        'moderation_status', l.moderation_status, 'moderation_note', l.moderation_note,
        'price_cents', l.price_cents, 'currency', l.currency,
        'host_name', coalesce(p.full_name, 'Host'), 'host_id', l.host_id,
        'created_at', l.created_at
      ) order by l.created_at desc)
      from listings l left join profiles p on p.id = l.host_id
      where l.moderation_status <> 'approved'
    ), '[]'::jsonb),

    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'body', r.body, 'rating', r.rating, 'status', r.status,
        'listing_title', l.title, 'listing_id', r.listing_id,
        'author', coalesce(p.full_name, 'Guest'), 'created_at', r.created_at
      ) order by r.created_at desc)
      from reviews r
      join listings l on l.id = r.listing_id
      left join profiles p on p.id = r.guest_id
      where r.status = 'removed' or r.rating <= 2
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_moderation_queue() from public, anon;
grant execute on function public.admin_moderation_queue() to authenticated;

-- The audit log, as the /admin/audit screen reads it.
create or replace function public.admin_list_audit(p_limit int default 100, p_action text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(x order by seq desc) from (
      select a.seq,
             jsonb_build_object(
               'id', a.id, 'seq', a.seq, 'action', a.action,
               'actor_name', coalesce(p.full_name, 'staff'), 'actor_role', a.actor_role,
               'subject_type', a.subject_type, 'subject_id', a.subject_id,
               'reason_code', a.reason_code, 'note', a.note,
               'blast_radius', a.blast_radius, 'created_at', a.created_at
             ) as x
        from audit_log a left join profiles p on p.id = a.actor_id
       where (p_action is null or a.action = p_action)
       order by a.seq desc
       limit least(greatest(coalesce(p_limit, 100), 1), 500)
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_audit(int, text) from public, anon;
grant execute on function public.admin_list_audit(int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Blast radius for the new subjects
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
  if p_action = 'user.suspend' then
    select count(*) into v_listings from listings where host_id = p_subject_id::uuid;
    select count(*), coalesce(sum(b.total_cents), 0), count(distinct b.guest_id)
      into v_bookings, v_value, v_guests
      from bookings b left join listings l on l.id = b.listing_id
     where b.status = 'confirmed' and b.start_date >= current_date
       and (b.guest_id = p_subject_id::uuid or l.host_id = p_subject_id::uuid);
    return jsonb_build_object(
      'listings_affected', v_listings, 'upcoming_bookings', v_bookings,
      'upcoming_booking_value_cents', v_value, 'guests_notified', v_guests);

  elsif p_action in ('listing.reject', 'listing.request_changes') then
    select count(*), coalesce(sum(total_cents), 0), count(distinct guest_id)
      into v_bookings, v_value, v_guests
      from bookings
     where listing_id = p_subject_id::uuid and status = 'confirmed' and start_date >= current_date;
    return jsonb_build_object(
      'upcoming_bookings', v_bookings, 'upcoming_booking_value_cents', v_value,
      'guests_notified', v_guests);

  elsif p_action = 'booking.cancel' then
    select 1, total_cents, 1 into v_bookings, v_value, v_guests
      from bookings where id = p_subject_id::uuid;
    return jsonb_build_object(
      'upcoming_bookings', coalesce(v_bookings, 0),
      'upcoming_booking_value_cents', coalesce(v_value, 0),
      'guests_notified', coalesce(v_guests, 0));

  -- An emergency kill-switch is the largest-blast-radius action in the console:
  -- it does not touch one record, it changes the product for everyone. Say so.
  elsif p_action = 'flag.toggle' then
    if exists (select 1 from feature_flags where key = p_subject_id and is_emergency) then
      select count(*), coalesce(sum(total_cents), 0), count(distinct guest_id)
        into v_bookings, v_value, v_guests
        from bookings where status = 'confirmed' and start_date >= current_date;
      return jsonb_build_object(
        'emergency', true, 'platform_wide', true,
        'upcoming_bookings', v_bookings, 'upcoming_booking_value_cents', v_value,
        'guests_notified', v_guests);
    end if;
    return jsonb_build_object('platform_wide', true, 'upcoming_bookings', 0,
      'upcoming_booking_value_cents', 0, 'guests_notified', 0);
  end if;

  return jsonb_build_object('upcoming_bookings', 0, 'upcoming_booking_value_cents', 0, 'guests_notified', 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Grants (explicit — see 0007 for why we never inherit these)
-- ---------------------------------------------------------------------------

grant select                 on public.feature_flags    to anon, authenticated;
grant select, insert         on public.incidents        to authenticated;
grant select, insert         on public.incident_events  to authenticated;
grant select                 on public.listing_calendar to anon, authenticated;
grant insert, update, delete on public.listing_calendar to authenticated;

revoke update, delete on public.feature_flags   from authenticated;  -- admin_action only
revoke update, delete on public.incidents       from authenticated;  -- admin_action only
