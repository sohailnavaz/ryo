-- 0022_notify_triggers.sql — make the notifications inbox actually light up.
--
-- The `notifications` table + RLS (0007) and the client inbox
-- (`useNotificationsInbox`) are already wired, but nothing writes rows on real
-- events, and the self-insert RLS means a host's action can't notify a guest.
-- This adds a SECURITY DEFINER `notify()` (bypasses the self-insert policy so a
-- trigger can notify the counterparty) plus triggers on the events that matter:
-- booking lifecycle, new messages, and a welcome on signup.

-- ---------------------------------------------------------------------------
-- notify(): insert a notification for ANY user. SECURITY DEFINER so triggers
-- firing as the acting user can still write the recipient's row.
-- ---------------------------------------------------------------------------
create or replace function public.notify(
  p_profile uuid,
  p_kind    text,
  p_title   text,
  p_body    text default ''
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_profile is null then
    return null;
  end if;
  insert into public.notifications (profile_id, kind, title, body)
  values (p_profile, p_kind, p_title, coalesce(p_body, ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bookings → notify the host on a new request, and the guest on the host's
-- decision. Status flow: pending → accepted → confirmed → declined / cancelled.
-- ---------------------------------------------------------------------------
create or replace function public.tg_booking_notify() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host    uuid;
  v_listing text;
  v_when    text;
begin
  select l.host_id, l.title into v_host, v_listing
  from public.listings l where l.id = new.listing_id;
  v_when := to_char(new.start_date, 'Mon DD');

  if tg_op = 'INSERT' then
    -- A new reservation lands in the host's inbox.
    perform public.notify(
      v_host,
      'booking',
      case when new.status = 'pending' then 'New booking request' else 'New booking' end,
      coalesce(v_listing, 'Your listing') || ' · ' || v_when
    );
    return new;
  end if;

  -- UPDATE: only when the status actually transitions.
  if new.status is distinct from old.status then
    if new.status in ('accepted', 'confirmed') then
      perform public.notify(new.guest_id, 'booking', 'Booking confirmed',
        coalesce(v_listing, 'Your stay') || ' is confirmed for ' || v_when || '.');
    elsif new.status = 'declined' then
      perform public.notify(new.guest_id, 'booking', 'Booking declined',
        'Your request for ' || coalesce(v_listing, 'a listing') || ' was declined.');
    elsif new.status = 'cancelled' then
      -- Tell whoever did NOT cancel.
      if new.cancelled_by = 'host' then
        perform public.notify(new.guest_id, 'booking', 'Booking cancelled',
          coalesce(v_listing, 'Your stay') || ' was cancelled by the host.');
      else
        perform public.notify(v_host, 'booking', 'Booking cancelled',
          'A guest cancelled their booking for ' || coalesce(v_listing, 'your listing') || '.');
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists booking_notify on public.bookings;
create trigger booking_notify
  after insert or update on public.bookings
  for each row execute function public.tg_booking_notify();

-- ---------------------------------------------------------------------------
-- Messages → notify the other participant in the thread.
-- ---------------------------------------------------------------------------
create or replace function public.tg_message_notify() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest     uuid;
  v_host      uuid;
  v_recipient uuid;
begin
  select guest_id, host_id into v_guest, v_host
  from public.message_threads where id = new.thread_id;

  v_recipient := case when new.sender_id = v_guest then v_host else v_guest end;

  if v_recipient is not null and v_recipient <> new.sender_id then
    perform public.notify(v_recipient, 'message', 'New message',
      left(coalesce(new.body, ''), 120));
  end if;
  return new;
end;
$$;

drop trigger if exists message_notify on public.messages;
create trigger message_notify
  after insert on public.messages
  for each row execute function public.tg_message_notify();

-- ---------------------------------------------------------------------------
-- New profile → a warm welcome so the inbox is never empty.
-- ---------------------------------------------------------------------------
create or replace function public.tg_welcome_notify() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify(
    new.id,
    'system',
    'Welcome to Ryo',
    'Every stay, hosted — not just booked. Start with a search, save a few places, and travel your way.'
  );
  return new;
end;
$$;

drop trigger if exists welcome_notify on public.profiles;
create trigger welcome_notify
  after insert on public.profiles
  for each row execute function public.tg_welcome_notify();

-- notify() is invoked by the triggers (as definer); expose it to the service
-- role too for server-side / edge use. Not granted to `anon`.
grant execute on function public.notify(uuid, text, text, text) to authenticated, service_role;
