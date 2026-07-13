-- 0006_admin_lists.sql — Phase 1 of the admin console (docs/15-admin-console.md §3).
--
-- Replaces "fetch every row and filter in the browser" with a server-driven list.
--
-- The old AdminUsersScreen downloaded every user, filtered in memory, and mounted
-- every row. At 100 users that looks fine; at 50,000 the tab dies. But the bigger
-- flaw was conceptual: its default view was "every account on file" — a question
-- nobody actually asks. This migration makes SEGMENTS the front door and the raw
-- list the escape hatch.
--
-- What lands here:
--   1. `mask_email()`      — PII is masked by default; unmasking is an audited act.
--   2. `admin_users_v`     — one source for user list data (never exposed directly).
--   3. `admin_list_users()`— server-side segments + KEYSET pagination + facet counts.
--   4. `admin_views`       — saved segments as first-class, shareable objects.
--   5. `admin_omnibox()`   — ⌘K: resolve any identifier straight to its record.
--
-- Keyset, not OFFSET: `offset 50000` makes Postgres walk 50,000 rows AND silently
-- skips or repeats records when the data mutates between pages — which, in a live
-- ops console, it constantly does.

-- ---------------------------------------------------------------------------
-- 1. PII masking
-- ---------------------------------------------------------------------------

create or replace function public.mask_email(p_email text)
returns text
language sql
immutable
as $$
  select case
    when p_email is null then null
    when position('@' in p_email) = 0 then '•••'
    else left(split_part(p_email, '@', 1), 1) || '•••@' || split_part(p_email, '@', 2)
  end;
$$;

-- ---------------------------------------------------------------------------
-- 2. The user list source.
--
-- NOT exposed through PostgREST — it reads auth.users, so every grant is revoked
-- and only the SECURITY DEFINER functions below may read it.
-- ---------------------------------------------------------------------------

create or replace view public.admin_users_v as
select
  p.id,
  coalesce(p.full_name, split_part(u.email, '@', 1)) as display_name,
  p.avatar_url,
  p.role,
  p.status,
  p.created_at,
  p.suspended_at,
  p.suspended_reason,
  u.email,
  u.last_sign_in_at,
  coalesce(g.bookings_count, 0)  as bookings_count,
  coalesce(g.ltv_cents, 0)       as ltv_cents,
  coalesce(g.nights, 0)          as nights,
  coalesce(h.listings_count, 0)  as listings_count,
  coalesce(h.host_bookings, 0)   as host_bookings
from public.profiles p
left join auth.users u on u.id = p.id
left join lateral (
  select count(*)::bigint                                  as bookings_count,
         coalesce(sum(b.total_cents), 0)::bigint           as ltv_cents,
         coalesce(sum(b.end_date - b.start_date), 0)::bigint as nights
    from public.bookings b
   where b.guest_id = p.id and b.status = 'confirmed'
) g on true
left join lateral (
  select count(distinct l.id)::bigint as listings_count,
         count(b.id)::bigint          as host_bookings
    from public.listings l
    left join public.bookings b on b.listing_id = l.id and b.status = 'confirmed'
   where l.host_id = p.id
) h on true;

revoke all on public.admin_users_v from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Saved views (segments) — shareable objects, not component state
-- ---------------------------------------------------------------------------

create table if not exists public.admin_views (
  id          uuid primary key default gen_random_uuid(),
  resource    text not null,
  key         text not null,
  name        text not null,
  description text not null default '',
  definition  jsonb not null default '{}'::jsonb,
  owner_id    uuid references public.profiles(id) on delete cascade,
  is_system   boolean not null default false,
  is_shared   boolean not null default false,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now(),
  unique (resource, key, owner_id)
);

alter table public.admin_views enable row level security;

create policy "admin_views staff read"
  on public.admin_views for select
  using (public.is_staff() and (is_system or is_shared or owner_id = auth.uid()));

create policy "admin_views staff write own"
  on public.admin_views for insert
  with check (public.is_staff() and owner_id = auth.uid() and not is_system);

create policy "admin_views staff delete own"
  on public.admin_views for delete
  using (public.is_staff() and owner_id = auth.uid() and not is_system);

-- The system segments.
--
-- ONLY segments we can actually compute from data that exists are shipped.
-- docs/15 §3 also lists "hosts pending KYC" and "high risk" — those need the KYC
-- and risk tables (Phases 4 and 7). Shipping them now against invented data is
-- exactly the demo-ware we are removing, so they are absent rather than fake.
insert into public.admin_views (resource, key, name, description, definition, is_system, sort_order) values
  ('users', 'needs_attention',    'Needs attention',    'Suspended in the last 7 days — did we get it right?',
      '{"segment":"suspended_recent","sort":"suspended_at"}'::jsonb, true, 10),
  ('users', 'hosts_at_risk',      'Hosts about to churn','Hosts live 30+ days with no booking yet — still saveable',
      '{"segment":"hosts_no_bookings_30d","sort":"created_at"}'::jsonb, true, 20),
  ('users', 'new_signups',        'New this week',      'Signed up in the last 7 days',
      '{"segment":"new_signups_7d","sort":"created_at"}'::jsonb, true, 30),
  ('users', 'top_value',          'Most valuable',      'Highest lifetime spend — who the concierge should know',
      '{"segment":"top_value","sort":"ltv_cents"}'::jsonb, true, 40),
  ('users', 'hosts',              'Hosts',              'Everyone with a listing',
      '{"segment":"hosts","sort":"created_at"}'::jsonb, true, 50),
  ('users', 'staff',              'Staff',              'Everyone with console access',
      '{"segment":"staff","sort":"created_at"}'::jsonb, true, 60),
  ('users', 'all',                'All users',          'The escape hatch — rarely the right place to start',
      '{"segment":"all","sort":"created_at"}'::jsonb, true, 99)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. admin_list_users() — the server-driven list
--
-- Returns { rows, next_cursor, facets, total, total_is_estimate }.
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_users(
  p_segment text    default 'all',
  p_q       text    default null,
  p_filters jsonb   default '{}'::jsonb,
  p_sort    text    default 'created_at',
  p_dir     text    default 'desc',
  p_cursor  jsonb   default null,     -- { "v": <last row's sort value>, "id": <last row's id> }
  p_limit   int     default 50,
  p_unmask  boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role     text;
  v_where    text := 'true';
  v_sort_col text;
  v_sort_typ text;
  v_dir      text;
  v_cmp      text;
  v_sql      text;
  v_rows     jsonb;
  v_facets   jsonb;
  v_total    bigint;
  v_estimate boolean := false;
  v_limit    int := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_roles    text[];
  v_statuses text[];
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  -- Unmasking PII is an act, not a page load. Only admins, and it leaves a trace.
  if p_unmask then
    if v_role <> 'admin' then
      raise exception 'ADMIN_ACTION_FORBIDDEN: unmasking requires the admin role'
        using errcode = '42501';
    end if;
    perform record_event('pii.unmasked', 'user_list', p_segment, '{}'::jsonb, 'admin', null);
  end if;

  -------------------------------------------------------------------------
  -- Segment → predicate. Whitelisted; never interpolated from user input.
  -------------------------------------------------------------------------
  v_where := case coalesce(p_segment, 'all')
    when 'all'                   then 'true'
    when 'suspended'             then $w$ status = 'suspended' $w$
    when 'suspended_recent'      then $w$ status = 'suspended' and suspended_at > now() - interval '7 days' $w$
    when 'staff'                 then $w$ role in ('staff','admin') $w$
    when 'hosts'                 then $w$ role = 'host' $w$
    when 'new_signups_7d'        then $w$ created_at > now() - interval '7 days' $w$
    when 'hosts_no_bookings_30d' then $w$ role = 'host' and created_at < now() - interval '30 days' and host_bookings = 0 $w$
    when 'top_value'             then $w$ ltv_cents > 0 $w$
    else 'true'
  end;

  -------------------------------------------------------------------------
  -- Facet filters (multi-select, from the filter rail)
  -------------------------------------------------------------------------
  if p_filters ? 'role' then
    select array_agg(value::text) into v_roles from jsonb_array_elements_text(p_filters->'role') as value;
    if v_roles is not null then
      v_where := v_where || format(' and role = any(%L::text[])', v_roles);
    end if;
  end if;

  if p_filters ? 'status' then
    select array_agg(value::text) into v_statuses from jsonb_array_elements_text(p_filters->'status') as value;
    if v_statuses is not null then
      v_where := v_where || format(' and status = any(%L::text[])', v_statuses);
    end if;
  end if;

  -------------------------------------------------------------------------
  -- Search. A pasted uuid resolves exactly; anything else is a name/email match.
  -------------------------------------------------------------------------
  if p_q is not null and length(trim(p_q)) > 0 then
    if p_q ~ '^[0-9a-fA-F-]{36}$' then
      v_where := v_where || format(' and id = %L::uuid', trim(p_q));
    else
      v_where := v_where || format(
        ' and (display_name ilike %L or email ilike %L)',
        '%' || trim(p_q) || '%', '%' || trim(p_q) || '%'
      );
    end if;
  end if;

  -------------------------------------------------------------------------
  -- Sort — whitelisted column + its type (the type is needed to cast the cursor)
  -------------------------------------------------------------------------
  select c, t into v_sort_col, v_sort_typ from (values
    ('created_at',     'timestamptz'),
    ('suspended_at',   'timestamptz'),
    ('last_sign_in_at','timestamptz'),
    ('ltv_cents',      'bigint'),
    ('bookings_count', 'bigint'),
    ('listings_count', 'bigint'),
    ('display_name',   'text')
  ) as s(c, t) where c = coalesce(p_sort, 'created_at');

  if v_sort_col is null then
    v_sort_col := 'created_at';
    v_sort_typ := 'timestamptz';
  end if;

  v_dir := case when lower(coalesce(p_dir, 'desc')) = 'asc' then 'asc' else 'desc' end;
  v_cmp := case when v_dir = 'asc' then '>' else '<' end;

  -------------------------------------------------------------------------
  -- Keyset. (sort_col, id) is a total order, so a page boundary is exact even
  -- while rows are being inserted and updated underneath the operator.
  -------------------------------------------------------------------------
  if p_cursor is not null and p_cursor ? 'id' then
    if p_cursor->>'v' is null then
      -- nulls sort last on desc: once past them, only compare on id
      v_where := v_where || format(
        ' and (%I is null and id %s %L::uuid)', v_sort_col, v_cmp, p_cursor->>'id'
      );
    else
      v_where := v_where || format(
        ' and ((%I, id) %s (%L::%s, %L::uuid))',
        v_sort_col, v_cmp, p_cursor->>'v', v_sort_typ, p_cursor->>'id'
      );
    end if;
  end if;

  -------------------------------------------------------------------------
  -- The page
  -------------------------------------------------------------------------
  v_sql := format($f$
    select coalesce(jsonb_agg(r order by rn), '[]'::jsonb) from (
      select row_number() over () as rn, to_jsonb(x) - 'email' ||
             jsonb_build_object(
               'email', case when %L then x.email else public.mask_email(x.email) end,
               'email_masked', not %L,
               'cursor', jsonb_build_object('v', to_jsonb(x.%I), 'id', x.id)
             ) as r
        from (
          select * from public.admin_users_v
           where %s
           order by %I %s nulls last, id %s
           limit %s
        ) x
    ) y
  $f$, p_unmask, p_unmask, v_sort_col, v_where, v_sort_col, v_dir, v_dir, v_limit);

  execute v_sql into v_rows;

  -------------------------------------------------------------------------
  -- Facet counts. The filter rail is worthless without them — an operator
  -- shouldn't have to click a filter to discover it matches nothing.
  -------------------------------------------------------------------------
  execute format($f$
    select jsonb_build_object(
      'status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                   from (select status, count(*) as n from public.admin_users_v where %s group by status) s),
      'role',   (select coalesce(jsonb_object_agg(role, n), '{}'::jsonb)
                   from (select role, count(*) as n from public.admin_users_v where %s group by role) r)
    )
  $f$, v_where, v_where) into v_facets;

  -------------------------------------------------------------------------
  -- Total. NEVER count(*) an unfiltered large table for a badge — that is a full
  -- scan. Estimate for the raw list; count exactly only inside a narrow segment.
  -------------------------------------------------------------------------
  if coalesce(p_segment, 'all') = 'all'
     and (p_q is null or length(trim(p_q)) = 0)
     and p_filters = '{}'::jsonb then
    select greatest(reltuples::bigint, 0) into v_total
      from pg_class where oid = 'public.profiles'::regclass;
    v_estimate := true;
  else
    execute format('select count(*) from public.admin_users_v where %s', v_where) into v_total;
  end if;

  return jsonb_build_object(
    'rows',              v_rows,
    'facets',            v_facets,
    'total',             v_total,
    'total_is_estimate', v_estimate,
    'has_more',          jsonb_array_length(v_rows) >= v_limit
  );
end;
$$;

revoke all on function public.admin_list_users(text, text, jsonb, text, text, jsonb, int, boolean) from public, anon;
grant execute on function public.admin_list_users(text, text, jsonb, text, text, jsonb, int, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. admin_omnibox() — ⌘K.
--
-- THE primary navigation. Operators do not scroll to find a user; they paste an
-- email or a booking ref and expect to land on the record.
-- ---------------------------------------------------------------------------

create or replace function public.admin_omnibox(p_q text, p_limit int default 8)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_q    text := trim(coalesce(p_q, ''));
  v_out  jsonb := '[]'::jsonb;
  v_lim  int := least(greatest(coalesce(p_limit, 8), 1), 20);
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'ADMIN_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  if length(v_q) < 2 then return v_out; end if;

  -- users
  v_out := v_out || (
    select coalesce(jsonb_agg(jsonb_build_object(
      'kind', 'user', 'id', id::text, 'label', display_name,
      'sublabel', public.mask_email(email) || ' · ' || role, 'href', '/admin/users/' || id::text
    )), '[]'::jsonb)
    from (
      select id, display_name, email, role from admin_users_v
       where (v_q ~ '^[0-9a-fA-F-]{36}$' and id = v_q::uuid)
          or display_name ilike '%' || v_q || '%'
          or email ilike '%' || v_q || '%'
       limit v_lim
    ) u
  );

  -- listings
  v_out := v_out || (
    select coalesce(jsonb_agg(jsonb_build_object(
      'kind', 'listing', 'id', id::text, 'label', title,
      'sublabel', city || ', ' || country || ' · ' || moderation_status,
      'href', '/admin/listings/' || id::text
    )), '[]'::jsonb)
    from (
      select id, title, city, country, moderation_status from listings
       where (v_q ~ '^[0-9a-fA-F-]{36}$' and id = v_q::uuid)
          or title ilike '%' || v_q || '%'
          or city ilike '%' || v_q || '%'
       limit v_lim
    ) l
  );

  -- bookings (by id — an operator pastes a ref from a support email)
  if v_q ~ '^[0-9a-fA-F-]{8,36}$' then
    v_out := v_out || (
      select coalesce(jsonb_agg(jsonb_build_object(
        'kind', 'booking', 'id', b.id::text,
        'label', 'Booking · ' || l.title,
        'sublabel', b.start_date::text || ' → ' || b.end_date::text || ' · ' || b.status,
        'href', '/admin/bookings/' || b.id::text
      )), '[]'::jsonb)
      from bookings b join listings l on l.id = b.listing_id
      where b.id::text ilike v_q || '%'
      limit v_lim
    );
  end if;

  return v_out;
end;
$$;

revoke all on function public.admin_omnibox(text, int) from public, anon;
grant execute on function public.admin_omnibox(text, int) to authenticated;
