-- 0009_console_reads.sql — finishes Phase 2 (docs/15-admin-console.md §10).
--
-- The last three console screens (bookings list, booking inspector, incident queue)
-- were still reading synthetic data merged with a browser-local override store. These
-- reads replace that, which is what finally lets `admin-store.ts` be deleted.
--
-- Note what is NOT here: the overview and finance dashboards stay synthetic, because
-- there is no revenue ledger yet (Phase 3). They keep their preview banner. Inventing
-- a real-looking GMV chart on top of no ledger would be the exact dishonesty this
-- whole phase exists to remove.

-- ---------------------------------------------------------------------------
-- Bookings list — one page, server-filtered. Status is DERIVED from dates:
-- the table only stores confirmed|cancelled, so "in stay" and "completed" are a
-- function of today, not a column. Computing that in the browser (as the old screen
-- did) meant every client had its own opinion of what "upcoming" meant.
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_bookings(
  p_filter text default 'all',   -- all | upcoming | in_stay | completed | cancelled
  p_q      text default null,
  p_limit  int  default 100
) returns jsonb
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
    select jsonb_agg(x order by start_date desc) from (
      select b.start_date,
             jsonb_build_object(
               'id', b.id,
               'listing_id', b.listing_id,
               'listing_title', l.title,
               'city', l.city,
               'guest_id', b.guest_id,
               'guest_name', coalesce(g.full_name, 'Guest'),
               'host_id', l.host_id,
               'host_name', coalesce(h.full_name, 'Host'),
               'start_date', b.start_date,
               'end_date', b.end_date,
               'total_cents', b.total_cents,
               'currency', l.currency,
               'status', b.status,
               'display_status', case
                 when b.status = 'cancelled'            then 'cancelled'
                 when b.end_date   < current_date       then 'completed'
                 when b.start_date <= current_date      then 'in_stay'
                 else 'upcoming'
               end
             ) as x
        from bookings b
        join listings l on l.id = b.listing_id
        left join profiles g on g.id = b.guest_id
        left join profiles h on h.id = l.host_id
       where (
              p_filter = 'all'
           or (p_filter = 'cancelled' and b.status = 'cancelled')
           or (p_filter = 'completed' and b.status <> 'cancelled' and b.end_date < current_date)
           or (p_filter = 'in_stay'   and b.status <> 'cancelled'
                                      and b.start_date <= current_date and b.end_date >= current_date)
           or (p_filter = 'upcoming'  and b.status <> 'cancelled' and b.start_date > current_date)
       )
         and (
              p_q is null or length(trim(p_q)) = 0
           or l.title ilike '%' || trim(p_q) || '%'
           or coalesce(g.full_name, '') ilike '%' || trim(p_q) || '%'
           or b.id::text ilike trim(p_q) || '%'
         )
       order by b.start_date desc
       limit least(greatest(coalesce(p_limit, 100), 1), 500)
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_bookings(text, text, int) from public, anon;
grant execute on function public.admin_list_bookings(text, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Booking inspector
-- ---------------------------------------------------------------------------

create or replace function public.admin_get_booking(p_id uuid)
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

  select jsonb_build_object(
    'id', b.id,
    'listing_id', b.listing_id,
    'listing_title', l.title,
    'city', l.city,
    'country', l.country,
    'guest_id', b.guest_id,
    'guest_name', coalesce(g.full_name, 'Guest'),
    'guest_email', mask_email(gu.email),
    'host_id', l.host_id,
    'host_name', coalesce(h.full_name, 'Host'),
    'start_date', b.start_date,
    'end_date', b.end_date,
    'nights', (b.end_date - b.start_date),
    'status', b.status,
    'display_status', case
      when b.status = 'cancelled'       then 'cancelled'
      when b.end_date   < current_date  then 'completed'
      when b.start_date <= current_date then 'in_stay'
      else 'upcoming'
    end,
    'total_cents', b.total_cents,
    'currency', l.currency,
    'created_at', b.created_at,

    -- The stored fee breakdown (migration 0004). Null on older rows — the screen
    -- says "not recorded" rather than inventing a plausible split.
    'breakdown', jsonb_build_object(
      'subtotal_cents',      b.subtotal_cents,
      'cleaning_fee_cents',  b.cleaning_fee_cents,
      'service_fee_cents',   b.service_fee_cents,
      'taxes_cents',         b.taxes_cents,
      'discount_cents',      b.discount_cents
    ),
    'guests', jsonb_build_object(
      'adults',   b.adults,
      'children', b.children,
      'infants',  b.infants,
      'pets',     b.pets
    ),

    'incidents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'subject', i.subject, 'status', i.status, 'tier', i.tier))
      from incidents i where i.booking_id = b.id
    ), '[]'::jsonb),

    'audit_trail', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'seq', a.seq, 'action', a.action, 'actor_role', a.actor_role,
        'actor_name', coalesce(ap.full_name, 'staff'),
        'reason_code', a.reason_code, 'note', a.note, 'created_at', a.created_at
      ) order by a.seq desc)
      from audit_log a left join profiles ap on ap.id = a.actor_id
      where a.subject_type = 'booking' and a.subject_id = p_id::text
    ), '[]'::jsonb)
  ) into v_out
  from bookings b
  join listings l on l.id = b.listing_id
  left join profiles g on g.id = b.guest_id
  left join auth.users gu on gu.id = b.guest_id
  left join profiles h on h.id = l.host_id
  where b.id = p_id;

  return v_out;
end;
$$;

revoke all on function public.admin_get_booking(uuid) from public, anon;
grant execute on function public.admin_get_booking(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Incident queue
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_incidents(p_status text default null)
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
    select jsonb_agg(x order by tier, created_at) from (
      select i.tier, i.created_at,
             jsonb_build_object(
               'id', i.id,
               'subject', i.subject,
               'detail', i.detail,
               'category', i.category,
               'tier', i.tier,
               'status', i.status,
               'guest_id', i.guest_id,
               'guest_name', coalesce(g.full_name, 'Guest'),
               'listing_id', i.listing_id,
               'listing_title', coalesce(l.title, '—'),
               'booking_id', i.booking_id,
               'assigned_to', i.assigned_to,
               'assignee_name', coalesce(a.full_name, null),
               'created_at', i.created_at,
               'resolved_at', i.resolved_at,
               'events', coalesce((
                 select jsonb_agg(jsonb_build_object(
                   'id', e.id, 'kind', e.kind, 'body', e.body,
                   'actor_label', e.actor_label, 'created_at', e.created_at
                 ) order by e.created_at)
                 from incident_events e where e.incident_id = i.id
               ), '[]'::jsonb)
             ) as x
        from incidents i
        left join profiles g on g.id = i.guest_id
        left join profiles a on a.id = i.assigned_to
        left join listings l on l.id = i.listing_id
       where p_status is null or i.status = p_status
       order by i.tier, i.created_at
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_incidents(text) from public, anon;
grant execute on function public.admin_list_incidents(text) to authenticated;
