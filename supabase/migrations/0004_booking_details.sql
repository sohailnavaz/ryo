-- 0004_booking_details.sql — columns the booking flow writes (guest breakdown +
-- price breakdown). useCreateBooking inserts these; without them a real booking
-- INSERT fails. All nullable-with-defaults so existing rows + the insert are safe.

alter table public.bookings
  add column if not exists adults             integer not null default 1,
  add column if not exists children           integer not null default 0,
  add column if not exists infants            integer not null default 0,
  add column if not exists pets               integer not null default 0,
  add column if not exists subtotal_cents     integer not null default 0,
  add column if not exists cleaning_fee_cents integer not null default 0,
  add column if not exists service_fee_cents  integer not null default 0,
  add column if not exists taxes_cents        integer not null default 0,
  add column if not exists discount_cents     integer not null default 0;
