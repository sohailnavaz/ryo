# 05 · Bookings

> How a guest goes from "I like this place" to "I have a confirmed, protected stay."

| Field         | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Module ID     | `05-bookings`                                                                               |
| Status        | ✏️ Draft                                                                                    |
| v1 scope      | Full booking flow with **mock payment**. Real payments via [06](./06-payments-payouts.md) in v2. |
| Owner         | TBD                                                                                         |
| Linked        | [03 listings](./03-listings.md), [06 payments](./06-payments-payouts.md), [11 trust-safety](./11-trust-safety.md), [12 concierge](./12-concierge-support.md) |
| Last updated  | 2026-04-23                                                                                  |

---

## 1. Purpose & Ryo alignment

The booking is the moment of commitment — where trust converts to revenue. It must be **honest (total price visible early), fast (≤3 steps from listing to confirmation), and protected (service guarantees activate on confirmation)**. Aligns with [branding §3.3](./branding.md#33-differentiators-the-better-than-airbnb-axes-) #3 (service guarantees) and #5 (calm UI).

---

## 2. User stories

### Guest
- As a guest, I want to see the full total (nightly × nights + fees + taxes) before I enter payment details.
- As a guest, I want to know exactly what I am agreeing to (cancellation policy, house rules).
- As a guest, I want to modify or cancel easily within the policy window.
- As a guest, I want to know my service guarantees in plain language.

### Host
- As a host, I want new bookings to auto-confirm when `instant_book = true`.
- As a host, I want to review requests within my response window for non-instant bookings.
- As a host, I want clear notice when a guest cancels, with payout impact shown.

### Concierge
- As a concierge, I want to view any booking and take corrective actions (re-book, credit, refund) without touching the DB.

---

## 3. Booking lifecycle (state machine) 🔒

```
draft → quoted → requested → confirmed → in_stay → completed
                     │            │
                     └→ rejected  └→ cancelled → refunded
                                        │
                                        └→ disputed
```

| State        | Meaning                                                                            |
| ------------ | ---------------------------------------------------------------------------------- |
| `draft`      | Guest opened checkout, not submitted                                               |
| `quoted`     | Price + terms frozen for 15 min                                                    |
| `requested`  | Guest submitted; host to accept (non-instant flow)                                 |
| `confirmed`  | Booked; payment captured (or authorised + scheduled); calendar locked              |
| `in_stay`    | Check-in date passed                                                               |
| `completed`  | Check-out + 48h review window opened                                               |
| `rejected`   | Host declined request                                                              |
| `cancelled`  | Guest or host cancelled                                                            |
| `refunded`   | Money returned per policy                                                          |
| `disputed`   | Escalated to T&S                                                                   |

State changes are event-sourced; an append-only `booking_events` table records every transition with actor + reason.

---

## 4. Core flows

### 4.1 Instant book
1. Guest taps "Reserve" on a listing with `instant_book = true`.
2. System re-verifies availability (race condition guard) and quote freshness.
3. Guest confirms payment method → capture (or authorise — depends on policy) → state `confirmed`.
4. Host notified; calendar locked; guest sees confirmation + next-steps.

### 4.2 Request-to-book
1. Guest submits with message to host.
2. State `requested`; host has 24h to respond.
3. Host accepts → payment captured → `confirmed`. Host rejects → `rejected`; no charge.
4. If host times out, system auto-declines and no charge occurs; guest gets a nudge + alternatives.

### 4.3 Modifications
- Date change / guest-count change → re-priced.
- Both parties must consent to significant changes.
- System computes delta and charges or refunds accordingly.

### 4.4 Cancellation (guest-initiated)
Cancellation policy (set by host at listing level) determines refund:

| Policy      | Full refund window         | Partial window         | Beyond                     |
| ----------- | -------------------------- | ---------------------- | -------------------------- |
| **Flexible**| Up to 24h before check-in  | 50% beyond             | 0% from 24h before         |
| **Moderate**| Up to 5 days before        | 50% to 24h before      | 0% from 24h before         |
| **Strict**  | Up to 14 days before       | 50% to 7 days before   | 0% within 7 days           |

- Cleaning fee refunded if cancellation is before check-in.
- Service fee non-refundable in v1 (review in v2 — quiet-luxury brand arguably returns it).

### 4.5 Cancellation (host-initiated)
- Host cancellations damage the host and the guest — so they are **heavily discouraged**:
  - Full guest refund.
  - Penalty: cancelled dates blocked on host's calendar.
  - Severity scoring; repeat offenders lose Boutique tier.
- Concierge immediately engages the guest with re-book options (same area, same budget, priority Boutique) — this is the "re-book protection" guarantee.

### 4.6 Platform cancellation
- Reserved for T&S incidents (fraud, listing misrepresentation, safety).
- Full guest refund + concierge-led re-book.

### 4.7 No-show
- Host marks no-show after 24h from check-in; concierge verifies.
- Refund depends on evidence; default is no refund.

### 4.8 Check-in / check-out
- Check-in instructions delivered 24h before via email + push ([09 notifications](./09-notifications-mail.md)).
- Guest can confirm arrival in-app → triggers host notification.
- Check-out reminder at T−2h of local check-out time.

---

## 5. Data model

### `public.bookings`
| Column                 | Type              | Notes                                             |
| ---------------------- | ----------------- | ------------------------------------------------- |
| `id`                   | `uuid PK`         |                                                   |
| `listing_id`           | `uuid FK`         |                                                   |
| `guest_id`             | `uuid FK`         |                                                   |
| `host_id`              | `uuid FK`         | Denormalised                                      |
| `state`                | `text`            | See §3                                            |
| `check_in`             | `date`            |                                                   |
| `check_out`            | `date`            |                                                   |
| `guests_count`         | `int`             |                                                   |
| `nightly_minor`        | `int`             | Frozen at quote                                   |
| `cleaning_fee_minor`   | `int`             |                                                   |
| `guest_service_fee_minor`| `int`           |                                                   |
| `host_service_fee_minor` | `int`           |                                                   |
| `tax_minor`            | `int`             |                                                   |
| `total_minor`          | `int`             | What guest pays                                   |
| `currency`             | `text`            | Charge currency                                   |
| `fx_pinned_at`         | `timestamptz`     | When FX was frozen                                |
| `cancellation_policy`  | `text`            | Snapshot from listing                             |
| `message_to_host`      | `text`            |                                                   |
| `quote_expires_at`     | `timestamptz`     |                                                   |
| `confirmed_at`         | `timestamptz`     |                                                   |
| `cancelled_at`         | `timestamptz`     |                                                   |
| `cancelled_by`         | `text`            | `guest` / `host` / `platform`                     |

### `public.booking_events`
Append-only event log: `(id, booking_id, event_type, actor_id, payload jsonb, created_at)`.

### `public.booking_calendar_locks`
Prevents double-booking: unique constraint on `(listing_id, date)` referencing `bookings.id`.

---

## 6. API surface

- `POST /bookings/quote` — returns frozen price + fees + tax + FX.
- `POST /bookings/request` — submit booking or request.
- `POST /bookings/:id/confirm-payment` — integrated with [06 payments](./06-payments-payouts.md).
- `POST /bookings/:id/modify` — both parties consent.
- `POST /bookings/:id/cancel` — guest / host / platform.
- `GET /bookings?role=guest|host&state=` — list mine.
- `GET /bookings/:id` — detail with event log.

---

## 7. Edge cases & failure modes

- **Race condition on instant book.** Concurrent `requested` + `confirmed` attempts on the same dates — enforce via unique constraint on `(listing_id, date)` locks + transactional booking create.
- **Quote expiry.** Prices re-fetched after 15 min; guest shown diff and consents to new total.
- **Host response timeout.** Requests auto-decline after 24h; email reminder at 12h.
- **Partial refund math.** Clear, itemised refund breakdown shown to guest at cancellation confirm — never surprise.
- **Guest pays in currency X, host is paid in currency Y, FX moves.** FX pinned at confirm — Ryo bears the float risk between confirm and payout.
- **Dispute during stay.** Escalates to concierge → T&S ([§11](./11-trust-safety.md)).
- **Repeat no-show guests.** Flagged; may lose instant-book privilege.
- **Overlapping holds.** Calendar-lock expiry after quote expires, so a listing isn't held forever by a draft.
- **Time-zone edge on check-in/out dates.** `check_in` and `check_out` are `date` in the **listing's local timezone** — store tz on listing; render in guest's tz on display.

---

## 8. KPIs

- **Search → booking conversion**.
- **Request-to-accept rate** (by host).
- **Time to host response** (P50, P95).
- **Guest-initiated cancellation rate** by policy tier.
- **Host-initiated cancellation rate** (target: trend to zero).
- **Re-book success** when concierge engages (proof of guarantee).
- **Payment-attempt success rate** ([06](./06-payments-payouts.md)).

---

## 9. Dependencies

- [03 listings](./03-listings.md) — price, policy, availability.
- [06 payments](./06-payments-payouts.md) — capture, refunds, FX.
- [09 notifications](./09-notifications-mail.md) — confirmations, reminders.
- [11 trust-safety](./11-trust-safety.md) — disputes, platform cancellations.
- [12 concierge](./12-concierge-support.md) — re-book protection.

---

## 10. v1 scope

- ✅ Instant-book path (mock payment).
- ✅ Price quote + freeze window.
- ✅ Cancellation (guest-initiated, Flexible policy only — others stubbed).
- ✅ Booking detail + basic status.
- 🔲 Request-to-book flow — v2 (no host UI yet).
- 🔲 Host-initiated cancellation — v2.
- 🔲 Modifications — v2.
- 🔲 Re-book protection concierge path — v2.

---

## 11. Open questions

- 🔲 Should guest-service fee be refundable on any cancellation? (Brand-honest argument: yes.)
- 🔲 Default cancellation policy for new hosts — Moderate is standard industry, Flexible is more guest-friendly.
- 🔲 Deposits for high-value stays — required or optional?
- 🔲 Long-stay (28+ night) pricing and cancellation — separate policy tier?
- 🔲 Group-booking / multi-property reservations — v3 or never?
