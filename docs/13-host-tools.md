# 13 · Host Tools

> Everything a host uses to run their business on Ryo — onboarding, calendar, pricing, earnings, performance.

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Module ID     | `13-host-tools`                                                                            |
| Status        | ✏️ Draft                                                                                   |
| v1 scope      | Not in v1. Full module is **v2**.                                                          |
| Owner         | TBD                                                                                        |
| Linked        | [02 auth](./02-auth-identity.md), [03 listings](./03-listings.md), [05 bookings](./05-bookings.md), [06 payments](./06-payments-payouts.md), [08 reviews](./08-reviews-ratings.md) |
| Last updated  | 2026-04-24                                                                                 |

---

## 1. Purpose & Ryo alignment

The host experience determines supply quality. Hosts need a tool that treats them as professionals — clear earnings, reliable calendar, respectful coaching, fast payouts. A boutique host running 3 properties should be able to operate Ryo in 20 minutes a day.

Aligns with brand values #1 (hospitality first), #3 (trust earned), #5 (quiet luxury — applies to host tooling too).

---

## 2. User stories

### New host
- As a new host, I want to publish my first listing within a single evening.
- As a new host, I want clear guidance on photos, title, and pricing.
- As a new host, I want to know exactly what I'll earn per booking.

### Active host (single-property)
- As a host, I want all my bookings, messages, and earnings on one screen.
- As a host, I want to block dates in 2 taps from the calendar.
- As a host, I want to sync my iCal so I never double-book.

### Multi-property host
- As a multi-property host, I want to switch listings quickly and act in bulk where safe.
- As a multi-property host, I want unified payout reports across properties.

### Concierge / Moderator
- As concierge, I want to see host health: response rate, rating trend, cancellation count — without a database query.

---

## 3. Core surfaces

### 3.1 Onboarding wizard
Guided creation flow (see [§03 listings](./03-listings.md) §4.1). Adds:
- Bank / payout method setup ([§06](./06-payments-payouts.md)).
- Tax info form (PAN / GSTIN for India, W-9/W-8 for US, EU tax IDs).
- Host expectations briefing (response time, cancellation policy, guarantees).

### 3.2 Host dashboard
One screen, sections:
- **Today** — arrivals, departures, messages needing reply.
- **Upcoming** — next 7 days at a glance.
- **Performance** — rating, response rate, acceptance rate, tier status.
- **Earnings** — this-month projected, next payout date.
- **Alerts** — listing issues, verification expirations, policy updates.

### 3.3 Calendar
- Month / agenda / timeline views.
- Drag to block / unblock dates.
- Per-day price overrides.
- **iCal import/export** (Google Calendar, Airbnb, Booking.com).
- Multi-property side-by-side view.
- Visual indicators: booked, blocked, on-hold (pending request), available.

### 3.4 Pricing tools
- Base nightly + weekend / weekday differential.
- Seasonal pricing rules.
- Length-of-stay discounts.
- Last-minute discount (default off).
- **Smart pricing suggestions** (v3) — compute from neighbourhood + demand signals; opt-in; host always in control.

### 3.5 Messages
Unified inbox across all the host's listings. Host can save templates ([§07](./07-messaging.md) §5 `thread_templates`).

### 3.6 Reviews
- Reviews received; respond where allowed.
- Reviews written by the host of past guests.
- Rating trend chart.

### 3.7 Statements & tax
- Monthly statement: bookings → gross → fees → net.
- Downloadable PDF / CSV.
- Year-end tax docs (1099-K equivalents per jurisdiction).

### 3.8 Listing editor
Per-listing edit screens; major changes re-enter moderation ([§03](./03-listings.md)).

### 3.9 Insights (v3)
- Views, conversion, rank in neighbourhood search.
- Photo-performance heatmap.
- Benchmark vs. peer set (anonymised).

---

## 4. Host health score 🔒

A composite score shown to the host (and used internally for tier + ranking):

| Component               | Weight | Source                                        |
| ----------------------- | ------ | --------------------------------------------- |
| Rating (rolling 60d)    | 30%    | [§08](./08-reviews-ratings.md)                |
| Response time           | 20%    | [§07](./07-messaging.md)                      |
| Acceptance rate         | 15%    | [§05](./05-bookings.md)                       |
| Cancellation rate (host)| 15%    | [§05](./05-bookings.md) — inverted            |
| Completeness of listing | 10%    | [§03](./03-listings.md) — photos, desc, rules |
| Calendar freshness      | 10%    | [§03](./03-listings.md) — updated_at          |

Transparent: host sees the breakdown. Coaching ([§12](./12-concierge-support.md)) engages when score drops.

---

## 5. Multi-property UX

- Property picker in the header.
- Bulk edits: price uplift across listings, blackout dates, policy change — previewed before apply.
- Consolidated payouts (one transfer / one statement if rails support).
- Shared team access (invite co-hosts with scoped roles).

---

## 6. Data model

### `public.host_profiles`
Extends `profiles` with host-specific fields: tax IDs, payout method refs, business name, co-host team.

### `public.host_team_members`
`host_id`, `member_user_id`, `scope` (full / messages-only / calendar-only / view-only).

### `public.ical_feeds`
External calendars imported; sync history.

### `public.pricing_rules`
See [§03](./03-listings.md) — host-owned.

Rest of the data is already defined elsewhere; host tools are primarily a **view + action** layer.

---

## 7. API surface

- `GET /host/dashboard` — aggregated snapshot.
- `GET /host/bookings?filter=` / `PATCH /host/bookings/:id/accept|decline|cancel`.
- `PUT /host/calendar/:listing_id` — bulk day updates.
- `POST /host/ical` — add / refresh.
- `GET /host/earnings/:period`.
- `POST /host/team/invite` / `DELETE /host/team/:id`.
- `GET /host/insights/:listing_id` (v3).

---

## 8. Edge cases & failure modes

- **iCal import conflicts** (another platform shows a date booked that Ryo shows free). Show conflicts; prompt host to resolve; never silently take one side.
- **Host co-host accidentally cancels booking.** Action confirmation + 1-hour undo window for cancellations.
- **Host changes payout bank near a scheduled payout.** Hold payout until re-verification ([§06](./06-payments-payouts.md)).
- **Smart-pricing suggestion ignored by host.** Respect host; no nagging.
- **Bulk-edit mis-apply.** Undo stack for the last bulk action.
- **Host tries to cancel an active guest.** Big-red-warning + confirmation + penalty disclosure.
- **Verification expiry.** 30 / 14 / 7 day reminders; listing auto-pauses after expiry until re-verified.

---

## 9. KPIs

- **Time to first listing publish** (new host signup → live).
- **Host DAU / WAU** on dashboard.
- **Response-time P50** across hosts.
- **Tier mobility** (hosts moving up/down).
- **iCal import adoption**.
- **Host-initiated cancellation rate** (watch; coach down).
- **Host NPS** (separate from guest NPS).

---

## 10. Dependencies

- Every other module feeds host tooling.
- **iCal**: RFC 5545 parser + incremental sync.
- **Tax docs**: accounting partner; PDF generation.

---

## 11. v1 scope

- 🔲 Not in v1. v1 is guest-only.
- ✅ Data model primitives (`host_profiles`, `pricing_rules`, calendar) exist so seeded hosts have data.

---

## 12. Open questions

- 🔲 Co-host model depth — full team + RBAC, or simple invite?
- 🔲 Smart pricing — build, integrate (PriceLabs / Beyond), or defer?
- 🔲 Host mobile app vs responsive web — both, or one?
- 🔲 Host referral programme — brand-on (quiet, valuable) or off (incentive-driven feels wrong)?
- 🔲 Host community / forum — helpful, but adds moderation burden.
