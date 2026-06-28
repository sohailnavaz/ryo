-- 0007_notifications.sql — per-user notification inbox.
--
-- Replaces the client-side `notifications-store.ts` localStorage layer so
-- read/unread state and the inbox itself sync across devices. Rows are written
-- server-side (booking confirmed, new message, review request, system) — clients
-- can mark read / mark all read / clear, but not forge arbitrary notifications
-- for themselves beyond their own row scope.

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('booking', 'message', 'review', 'system')),
  title      text not null,
  body       text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx
  on public.notifications (profile_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (profile_id) where read = false;

alter table public.notifications enable row level security;

create policy "notifications self read"
  on public.notifications for select
  using (auth.uid() = profile_id);

create policy "notifications self insert"
  on public.notifications for insert
  with check (auth.uid() = profile_id);

create policy "notifications self update"
  on public.notifications for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "notifications self delete"
  on public.notifications for delete
  using (auth.uid() = profile_id);
