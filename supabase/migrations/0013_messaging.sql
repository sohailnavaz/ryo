-- 0013_messaging.sql — guest↔host messaging, for real.
--
-- The most-stubbed thing in the app: the host inbox toasted "not actually sent", trip
-- detail said "messaging coming soon", and the concierge's message_host tool wrote
-- nothing. This is the primitive all three needed.
--
-- A thread is between exactly two people — a guest and a host — optionally about a
-- listing or a booking. RLS is strict: only the two participants can see a thread or
-- its messages, and only a participant can post to it. There is no "public" read.

create table if not exists public.message_threads (
  id              uuid primary key default gen_random_uuid(),
  guest_id        uuid not null references public.profiles(id) on delete cascade,
  host_id         uuid not null references public.profiles(id) on delete cascade,
  listing_id      uuid references public.listings(id) on delete set null,
  booking_id      uuid references public.bookings(id) on delete set null,
  subject         text not null default '',
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  -- Denormalised unread counters so an inbox list is one cheap read, not a subquery
  -- per row. Maintained by the send trigger below.
  guest_unread    int not null default 0,
  host_unread     int not null default 0,
  check (guest_id <> host_id)
);

create index if not exists threads_guest_idx on public.message_threads (guest_id, last_message_at desc);
create index if not exists threads_host_idx  on public.message_threads (host_id, last_message_at desc);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.message_threads(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages (thread_id, created_at);

alter table public.message_threads enable row level security;
alter table public.messages        enable row level security;

-- Only the two participants. A helper keeps the four policies readable and identical.
create or replace function public.is_thread_participant(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.message_threads t
     where t.id = p_thread and (t.guest_id = auth.uid() or t.host_id = auth.uid())
  );
$$;

drop policy if exists "threads participant read" on public.message_threads;
create policy "threads participant read" on public.message_threads for select
  using (auth.uid() = guest_id or auth.uid() = host_id);

-- A guest opens a thread; they must be the guest side of it (can't forge a thread as
-- someone else). Hosts get threads created for them by a guest's first message.
drop policy if exists "threads guest insert" on public.message_threads;
create policy "threads guest insert" on public.message_threads for insert
  with check (auth.uid() = guest_id);

-- Marking-as-read updates the unread counters; only a participant may.
drop policy if exists "threads participant update" on public.message_threads;
create policy "threads participant update" on public.message_threads for update
  using (auth.uid() = guest_id or auth.uid() = host_id)
  with check (auth.uid() = guest_id or auth.uid() = host_id);

drop policy if exists "messages participant read" on public.messages;
create policy "messages participant read" on public.messages for select
  using (public.is_thread_participant(thread_id));

-- You may only post AS yourself, and only to a thread you're in.
drop policy if exists "messages participant insert" on public.messages;
create policy "messages participant insert" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_thread_participant(thread_id));

-- On send: bump last_message_at and the OTHER party's unread counter, in the same
-- transaction as the insert, so the inbox is always consistent.
create or replace function public.on_message_sent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest uuid;
  v_host  uuid;
begin
  select guest_id, host_id into v_guest, v_host
    from message_threads where id = new.thread_id;

  update message_threads
     set last_message_at = new.created_at,
         guest_unread = guest_unread + (case when new.sender_id = v_host  then 1 else 0 end),
         host_unread  = host_unread  + (case when new.sender_id = v_guest then 1 else 0 end)
   where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_message_sent_trg on public.messages;
create trigger on_message_sent_trg
  after insert on public.messages
  for each row execute function public.on_message_sent();

-- Clear my unread counter when I open a thread. Runs as the caller through RLS
-- (the update policy already restricts it to participants).
create or replace function public.mark_thread_read(p_thread uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  update message_threads
     set guest_unread = case when guest_id = v_uid then 0 else guest_unread end,
         host_unread  = case when host_id  = v_uid then 0 else host_unread  end
   where id = p_thread and (guest_id = v_uid or host_id = v_uid);
end;
$$;

grant execute on function public.is_thread_participant(uuid) to authenticated;
grant execute on function public.mark_thread_read(uuid) to authenticated;

-- Grants (explicit — see 0007). Participant-scoped via RLS.
grant select, insert, update on public.message_threads to authenticated;
grant select, insert         on public.messages        to authenticated;
revoke all on public.message_threads from anon;
revoke all on public.messages        from anon;
