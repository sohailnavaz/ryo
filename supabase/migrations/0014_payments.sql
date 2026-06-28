-- 0014_payments.sql — payments + payouts schema (tables only).
--
-- The schema the real-payments work (Stripe / Razorpay, docs/06) will write to.
-- Rows are created/updated server-side from a trusted route or webhook handler
-- using the service-role key (which bypasses RLS); clients only ever READ their
-- own rows. No client INSERT/UPDATE policy is intentional — money state must not
-- be writable from the browser. Processor wiring (keys, webhooks) lands when the
-- founder provisions Stripe/Razorpay accounts.

-- ---------------------------------------------------------------------------
-- payment_intents — one per booking attempt
-- ---------------------------------------------------------------------------
create table if not exists public.payment_intents (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid references public.bookings(id) on delete set null,
  guest_id     uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency     text not null default 'INR',
  provider     text not null default 'stripe' check (provider in ('stripe', 'razorpay', 'mock')),
  provider_ref text,
  status       text not null default 'requires_payment'
               check (status in ('requires_payment', 'processing', 'succeeded', 'failed', 'refunded')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists payment_intents_guest_idx   on public.payment_intents (guest_id, created_at desc);
create index if not exists payment_intents_booking_idx on public.payment_intents (booking_id);

alter table public.payment_intents enable row level security;

-- Guest reads own; staff read all. No client write (service role only).
create policy "payment_intents guest read own"
  on public.payment_intents for select
  using (auth.uid() = guest_id or public.is_staff());

-- ---------------------------------------------------------------------------
-- payouts — host earnings disbursements
-- ---------------------------------------------------------------------------
create table if not exists public.payouts (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles(id) on delete cascade,
  booking_id    uuid references public.bookings(id) on delete set null,
  amount_cents  integer not null check (amount_cents >= 0),
  currency      text not null default 'INR',
  status        text not null default 'scheduled'
                check (status in ('scheduled', 'processing', 'paid', 'failed')),
  scheduled_for date,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists payouts_host_idx on public.payouts (host_id, created_at desc);

alter table public.payouts enable row level security;

-- Host reads own; staff read all. No client write (service role only).
create policy "payouts host read own"
  on public.payouts for select
  using (auth.uid() = host_id or public.is_staff());
