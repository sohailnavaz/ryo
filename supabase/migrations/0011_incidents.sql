-- 0011_incidents.sql — guest-reported incidents + their timeline events.
--
-- Replaces `incident-store.ts` (localStorage). A guest opens an incident from
-- /help; hosts see incidents on their listings; staff triage + resolve from
-- /admin/incidents. `incident_events` is the append-only timeline (opened,
-- status change, assignment, note, resolved). Denormalised name/title columns
-- mirror the store so admin lists render without extra joins.

create table if not exists public.incidents (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null references public.profiles(id) on delete cascade,
  guest_name    text not null default '',
  booking_id    uuid references public.bookings(id) on delete set null,
  listing_id    uuid references public.listings(id) on delete set null,
  listing_title text,
  host_id       uuid references public.profiles(id) on delete set null,
  host_name     text,
  category      text not null check (category in
                  ('safety', 'lockout', 'listing_mismatch', 'cleanliness', 'payment', 'cancellation', 'other')),
  tier          integer not null default 3 check (tier between 1 and 3),
  status        text not null default 'new' check (status in ('new', 'assigned', 'in_progress', 'resolved')),
  subject       text not null,
  detail        text not null default '',
  assigned_to   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create index if not exists incidents_guest_idx  on public.incidents (guest_id, created_at desc);
create index if not exists incidents_host_idx   on public.incidents (host_id, created_at desc);
create index if not exists incidents_status_idx on public.incidents (status, tier);

alter table public.incidents enable row level security;

-- Guest sees own; host sees incidents on their listings; staff see all.
create policy "incidents read scoped"
  on public.incidents for select
  using (
    auth.uid() = guest_id
    or auth.uid() = host_id
    or public.is_staff()
  );

create policy "incidents guest insert own"
  on public.incidents for insert
  with check (auth.uid() = guest_id);

-- Staff triage/resolve; guest may add detail to their own open incident.
create policy "incidents staff update"
  on public.incidents for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "incidents guest update own"
  on public.incidents for update
  using (auth.uid() = guest_id)
  with check (auth.uid() = guest_id);

-- ---------------------------------------------------------------------------
-- incident_events — append-only timeline
-- ---------------------------------------------------------------------------
create table if not exists public.incident_events (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  kind        text not null check (kind in ('opened', 'status_change', 'assignment', 'note', 'message', 'resolved')),
  body        text not null default '',
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_label text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists incident_events_incident_idx on public.incident_events (incident_id, created_at);

alter table public.incident_events enable row level security;

-- Visible to anyone who can see the parent incident.
create policy "incident_events read scoped"
  on public.incident_events for select
  using (exists (
    select 1 from public.incidents i
    where i.id = incident_id
      and (i.guest_id = auth.uid() or i.host_id = auth.uid() or public.is_staff())
  ));

-- A participant or staff can append an event to an incident they can see.
create policy "incident_events insert scoped"
  on public.incident_events for insert
  with check (exists (
    select 1 from public.incidents i
    where i.id = incident_id
      and (i.guest_id = auth.uid() or i.host_id = auth.uid() or public.is_staff())
  ));
