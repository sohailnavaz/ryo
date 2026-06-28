-- 0006_messaging.sql — guest <-> host messaging (threads + messages).
--
-- Replaces the fully-synthetic inbox in `host.ts` (useHostInbox / useHostInboxThread)
-- and the "Preview only — message not actually sent" toast. One thread per
-- (guest, host, listing); messages belong to a thread. RLS scopes everything to
-- the two participants. A trigger keeps `message_threads.last_message_at` fresh
-- so inbox lists can sort by recency without an aggregate.

-- ---------------------------------------------------------------------------
-- message_threads
-- ---------------------------------------------------------------------------
create table if not exists public.message_threads (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.listings(id) on delete cascade,
  booking_id      uuid references public.bookings(id) on delete set null,
  guest_id        uuid not null references public.profiles(id) on delete cascade,
  host_id         uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (guest_id, host_id, listing_id)
);

create index if not exists message_threads_host_idx  on public.message_threads (host_id, last_message_at desc);
create index if not exists message_threads_guest_idx on public.message_threads (guest_id, last_message_at desc);

alter table public.message_threads enable row level security;

create policy "threads participant read"
  on public.message_threads for select
  using (auth.uid() = guest_id or auth.uid() = host_id);

-- The guest opens the inquiry; the host's side is created from a booking.
create policy "threads participant insert"
  on public.message_threads for insert
  with check (auth.uid() = guest_id or auth.uid() = host_id);

create policy "threads participant update"
  on public.message_threads for update
  using (auth.uid() = guest_id or auth.uid() = host_id)
  with check (auth.uid() = guest_id or auth.uid() = host_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.message_threads(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(body) > 0),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages (thread_id, created_at);

alter table public.messages enable row level security;

-- Read/insert only if you are a participant of the parent thread.
create policy "messages participant read"
  on public.messages for select
  using (exists (
    select 1 from public.message_threads t
    where t.id = thread_id and (t.guest_id = auth.uid() or t.host_id = auth.uid())
  ));

create policy "messages sender insert"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.message_threads t
      where t.id = thread_id and (t.guest_id = auth.uid() or t.host_id = auth.uid())
    )
  );

-- Mark-as-read: a participant can update read_at on the other side's messages.
create policy "messages participant update"
  on public.messages for update
  using (exists (
    select 1 from public.message_threads t
    where t.id = thread_id and (t.guest_id = auth.uid() or t.host_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.message_threads t
    where t.id = thread_id and (t.guest_id = auth.uid() or t.host_id = auth.uid())
  ));

-- Bump the thread's last_message_at whenever a message lands.
create or replace function public.bump_thread_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.message_threads
    set last_message_at = new.created_at
    where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.bump_thread_last_message();
