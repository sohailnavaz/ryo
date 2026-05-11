# 08 · Reviews & Ratings

> Honest signal from real stays. Two-way, verified, simultaneous-reveal.

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Module ID     | `08-reviews-ratings`                                                                          |
| Status        | ✏️ Draft                                                                                      |
| v1 scope      | Display-only (show seeded reviews on listings). Submission flow is v2.                        |
| Owner         | TBD                                                                                           |
| Linked        | [05 bookings](./05-bookings.md), [04 search](./04-search-discovery.md), [11 trust-safety](./11-trust-safety.md) |
| Last updated  | 2026-04-24                                                                                    |

---

## 1. Purpose & Ryo alignment

Reviews are the compressed history of service quality. Because Ryo *claims* better service, the review system must be **more honest** than the competition — no review-for-review, no pressure to 5-star, no reviews from people who didn't stay. It is the system by which the brand is either justified or exposed.

---

## 2. Principles 🔒

1. **Verified-stay only.** A review can only be written by a guest whose booking reached `completed` — or by a host of a guest whose booking reached `completed`.
2. **Two-way.** Guests rate hosts; hosts rate guests. Both ratings feed reputation.
3. **Simultaneous reveal.** Neither side sees the other's review until **both have submitted** or **14 days have elapsed** since check-out. Removes incentive to retaliate.
4. **Time-boxed.** Reviews must be submitted within **14 days** of check-out. After that, the window closes — both sides.
5. **One review per stay, one host response.** No threads, no back-and-forth.
6. **Facts, not opinions when disputed.** Personal attacks, protected-class references, off-topic complaints are moderated out.

---

## 3. User stories

### Guest
- As a guest, I want to leave an honest review without fearing retaliation from the host.
- As a guest, I want categories that match how I experience a stay (not just "stars").
- As a guest, I want to optionally keep my last name private.

### Host
- As a host, I want to review guests so the next host has context.
- As a host, I want one chance to respond to a review — factually.
- As a host, I want to know when my rating drops and why.

### Concierge / Moderator
- As a moderator, I want to remove reviews that violate policy with a clear reason trail.
- As concierge, I want to see patterns in low-rated stays for the same host.

---

## 4. Rating schema

### Guest reviews host / listing
Overall rating (1–5) + category ratings:
- **Cleanliness**
- **Accuracy** (listing matched reality)
- **Check-in**
- **Communication**
- **Location**
- **Value**

Plus free text (min 50 chars, max 1000).

### Host reviews guest
Overall rating (1–5) + categories:
- **Cleanliness** (how they left the place)
- **Communication**
- **Respect for rules**

Plus free text (min 30 chars, max 500).

### Rating aggregation
- Listing-level aggregate = average of guest reviews with recency weighting (decay 12-month half-life).
- Host-level aggregate = average across all their listings.
- Guest-level aggregate = shown to hosts only; not publicly visible.

---

## 5. Core flows

### 5.1 Prompt to review
- At `check_out + 2h`: push + email to both parties.
- Reminders at +3 days and +10 days.
- Final reminder 24h before the 14-day close.

### 5.2 Write review
1. Composer with category sliders + free text + optional photo.
2. Save as draft allowed.
3. On submit → stored as `pending_reveal` until counterpart submits or window closes.

### 5.3 Reveal
- When both submit: both are published simultaneously.
- At T+14 days with only one submitted: the submitted one publishes; the other side silently closes.

### 5.4 Host response
- Once a guest review is revealed, host can post **one** reply (≤300 chars, 72h window).
- No further replies by either party.

### 5.5 Report & moderation
- Any user can report a review with a category (personal attack, off-topic, false, protected-class).
- Moderator triage SLA 48h.
- Outcomes: keep, edit-out offending portion (with note), remove.

### 5.6 Rating drops → host notification
- If a host's rolling 60-day rating falls ≥0.3★ below their prior, concierge reaches out with coaching + listing review.
- Boutique tier re-checked on threshold breaches.

---

## 6. Data model

### `public.reviews`
| Column              | Type          | Notes                                    |
| ------------------- | ------------- | ---------------------------------------- |
| `id`                | `uuid`        |                                          |
| `booking_id`        | `uuid FK`     |                                          |
| `author_id`         | `uuid FK`     |                                          |
| `author_role`       | `text`        | `guest` / `host`                         |
| `subject_role`      | `text`        | `host` / `guest`                         |
| `overall`           | `smallint`    | 1–5                                      |
| `categories`        | `jsonb`       | `{cleanliness: 5, accuracy: 4, …}`       |
| `body`              | `text`        |                                          |
| `photos`            | `jsonb`       | optional                                 |
| `state`             | `text`        | `draft` / `pending_reveal` / `published` / `removed` |
| `published_at`      | `timestamptz` |                                          |
| `window_closes_at`  | `timestamptz` |                                          |
| `moderation_notes`  | `text`        |                                          |

### `public.review_responses`
Host reply: `(review_id, author_id, body, created_at)`.

### `public.review_reports`
`(review_id, reporter_id, category, details, state)`.

### Materialised aggregates
Nightly jobs refresh `listings.rating_avg`, `listings.rating_count`, `hosts.rating_avg`, `guests.rating_avg`.

---

## 7. API surface

- `POST /reviews/draft` / `POST /reviews/submit`.
- `POST /reviews/:id/respond` — host response.
- `POST /reviews/:id/report`.
- `GET /listings/:id/reviews?cursor=` — paginated.
- `GET /profile/:id/reviews-written` — mine.
- `GET /profile/:id/reviews-received` — mine (host view).

---

## 8. Edge cases & failure modes

- **Guest wrote glowing review but private complaint.** Concierge reconciles offline; review stays as written but incident logged for T&S.
- **Retaliatory 1-star after legitimate guest review.** Simultaneous-reveal prevents this by design.
- **Host pressuring guest for a 5-star review.** Scan outbound messages for review-for-review patterns; T&S action.
- **Fake review via self-booking.** Detected via payment + identity checks; T&S removes.
- **Reviews tied to a booking that was later refunded/disputed.** Review may be suppressed pending dispute outcome.
- **Host has no reviews yet.** Show "New host" badge — not a penalty, just honest.
- **Translated reviews.** Render in reader's locale with "Translated from X" tag; toggle to original always available.
- **Protected-class references.** Auto-flag; moderator reviews; removal + user warning.

---

## 9. KPIs

- **Review submission rate** (bookings → reviews, both sides).
- **Median time to review** after check-out.
- **Distribution of ratings** (should skew high but have meaningful variance — if it's all 5s, the signal is broken).
- **Moderation action rate** (removals / flags).
- **Host response rate** to reviews.
- **Drop-in-rating alert-to-fix cycle time**.

---

## 10. Dependencies

- [05 bookings](./05-bookings.md) — completion triggers review eligibility.
- [09 notifications-mail](./09-notifications-mail.md) — prompts.
- [11 trust-safety](./11-trust-safety.md) — moderation rules.
- [10 i18n-localization](./10-i18n-localization.md) — translation.

---

## 11. v1 scope

- ✅ Seeded reviews displayed on listing detail.
- ✅ Aggregate rating & categories shown.
- 🔲 Review submission — **v2**.
- 🔲 Host response — **v2**.
- 🔲 Moderation console — **v2**.

---

## 12. Open questions

- 🔲 Show individual category averages publicly, or only overall? (Lean: individual.)
- 🔲 Allow photo uploads in reviews — enriches signal but increases moderation load.
- 🔲 Minimum completed-stay count before a host can review guests? (Industry: none; we might require 1 to protect newcomers.)
- 🔲 Anonymous reviews — off-brand (against our trust ethos) but some jurisdictions may require it.
- 🔲 Review deletion by author — allow within 24h of publish, otherwise not.
