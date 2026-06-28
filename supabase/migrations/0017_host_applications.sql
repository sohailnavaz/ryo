-- 0017_host_applications.sql — "apply to become a host" → admin approval → role.
--
-- Adds a gated host-onboarding flow: a guest submits an application (identity +
-- property intent + tax + terms), it lands as `pending`, staff review it in the
-- admin console, and on approval the user's profiles.role is promoted to 'host'
-- (done in the admin approve hook, which also writes audit_log). Until approved,
-- the user cannot publish listings (enforced in app + by role).

create table if not exists public.host_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected', 'changes_requested')),
  -- applicant identity
  full_name        text not null default '',
  phone            text,
  country          text,
  city             text,
  -- property / hosting intent
  property_type    text,
  property_city    text,
  property_country text,
  headline         text,   -- one-line pitch for their place
  about            text,   -- longer intro / hosting experience
  -- compliance
  tax_id           text,   -- PAN / GSTIN / TIN / etc.
  tax_country      text,
  agreed_terms     boolean not null default false,
  -- review trail
  reviewer_id      uuid references public.profiles(id) on delete set null,
  review_note      text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One application per user (resubmits update the same row).
create unique index if not exists host_applications_user_uidx on public.host_applications (user_id);
create index if not exists host_applications_status_idx on public.host_applications (status, created_at desc);

alter table public.host_applications enable row level security;

-- Applicant: read + create own; edit own only while still actionable.
create policy "host_applications self read"
  on public.host_applications for select
  using (auth.uid() = user_id or public.is_staff());

create policy "host_applications self insert"
  on public.host_applications for insert
  with check (auth.uid() = user_id);

create policy "host_applications self update"
  on public.host_applications for update
  using (auth.uid() = user_id and status in ('pending', 'changes_requested'))
  with check (auth.uid() = user_id);

-- Staff: review (approve / reject / request changes).
create policy "host_applications staff update"
  on public.host_applications for update
  using (public.is_staff())
  with check (public.is_staff());
