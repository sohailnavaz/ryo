# 11 · Trust & Safety

> Verification, fraud prevention, disputes, incident response, and insurance. The reason guests feel safe on Ryo.

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Module ID     | `11-trust-safety`                                                                        |
| Status        | ✏️ Draft                                                                                 |
| v1 scope      | Minimal — basic content moderation primitives and an audit trail. Full T&S ops in v2+.   |
| Owner         | TBD (Head of Trust & Safety, to be hired)                                                |
| Linked        | [02 auth](./02-auth-identity.md), [05 bookings](./05-bookings.md), [06 payments](./06-payments-payouts.md), [12 concierge](./12-concierge-support.md) |
| Last updated  | 2026-04-24                                                                               |

---

## 1. Purpose & Ryo alignment

Trust is the foundation of the Ryo promise. This is the product equivalent of a security team: verification deep enough that guests feel safe, fraud controls strong enough that hosts feel protected, incident response fast enough to matter.

This module is a **first-class product**, not a policy document. It has code, data, SLAs, and staff — not just rules.

Ties to every brand differentiator in [branding §3.3](./branding.md#33-differentiators-the-better-than-airbnb-axes-).

---

## 2. User stories

### Guest
- As a guest, I want to see exactly what is verified about a host and property before I book.
- As a guest, I want an SOS path during a stay that reaches a human in seconds.
- As a guest, I want to know I'm covered if a listing lied or a property is unsafe.

### Host
- As a host, I want protection against abusive guests, property damage, and fraudulent bookings.
- As a host, I want fair dispute handling with clear evidence requirements.
- As a host, I want a clear appeal path if my listing is flagged.

### Concierge / T&S
- As a T&S analyst, I want a single queue for incidents with severity tiers and clear SLAs.
- As concierge, I want to escalate to T&S in one action during a live stay.

---

## 3. Verification layers

Stacked, each adds trust.

| Layer                       | Applies to | Required for                          |
| --------------------------- | ---------- | ------------------------------------- |
| Email verified              | all        | Account creation                      |
| Phone verified              | all        | First booking                         |
| Government ID + liveness    | host       | Publishing a listing                  |
| Address proof               | host       | Publishing a listing                  |
| Property-right proof        | host       | Publishing a listing                  |
| On-site inspection          | host       | **Boutique** tier                     |
| Enhanced guest verification | guest      | High-value stays, high-risk markets   |

Every verification is **time-bounded** — re-verification cycles keep trust fresh (see [§02](./02-auth-identity.md)).

---

## 4. Fraud surfaces

### Signup / account
- Disposable email, throwaway phone, device-ID recycling.
- IP / geo mismatch with claimed country.
- Known-bad phone-number ranges.

### Listing
- Listing photos reused from the web (reverse image search).
- Address-ownership mismatch.
- Suspicious price (far below market — scam hook).

### Booking
- Card-not-present risk (BIN checks, velocity, 3DS).
- High-value booking within minutes of account creation.
- Multiple cards per account / same card across accounts.
- Guest-host collusion (self-booking).

### Post-booking
- Chargeback patterns.
- Payout redirection attempts (bank-detail changes just before payout).
- Off-platform payment pressure.

### Moderation
- Scraping / automated crawling of listings.
- Fake reviews, review-for-review, brigading.

---

## 5. Incident response

### Severity tiers 🔒

| Tier  | Examples                                                                          | First response SLA       |
| ----- | --------------------------------------------------------------------------------- | ------------------------ |
| **P0**| Physical safety (break-in, medical, violence, locked out at night)                | **< 2 minutes** (human)  |
| **P1**| Listing misrepresentation at check-in, major cleanliness / habitability, fraud    | **< 15 minutes**         |
| **P2**| Payment disputes, review disputes, policy violations                              | **< 4 hours**            |
| **P3**| Non-urgent complaints, questions, suggestions                                     | **< 24 hours**           |

### SOS (guest-facing panic path)
- One-tap "I need help now" from any in-stay screen.
- Opens direct line to concierge with location + booking context pre-loaded.
- Concierge can dispatch local emergency contacts if required.
- Always available — no authentication friction in the moment.

### Escalation ladder
1. Concierge handles most P2/P3.
2. T&S analyst for P1 + disputes.
3. T&S lead for P0, legal notices, regulator contact, media situations.

---

## 6. Disputes

### Dispute-eligible events
- Check-in failure (property unavailable, host unreachable).
- Material misrepresentation (photos don't match, missing amenities).
- Cleanliness / safety hazard.
- Damage claims (host against guest).
- Policy abuse (host / guest).
- Chargeback (processor-initiated).

### Evidence framework
- Thread history (messages, photos sent).
- Check-in confirmation state.
- Arrival verification (if captured).
- Third-party data (processor signals, KYC records, noise complaint).

### Resolution options
- Full / partial refund.
- Re-book protection (concierge-assisted, funded by Ryo).
- Host penalty (warning, tier loss, suspension).
- Guest penalty (warning, temporary or permanent ban).
- Platform absorption (Ryo pays in goodwill; logged in `financial_adjustments`).

SLA: resolution communicated within **72 hours** of evidence being complete.

---

## 7. Insurance / protection ✏️

Two programmes, funded through service fees:

### Host Protection
- Property damage by guest up to a capped amount.
- Excludes ordinary wear, pre-existing damage, security deposits (we don't charge deposits; this is the replacement).

### Guest Arrival Protection
- If the property at check-in is materially not as described, Ryo:
  1. Re-books a comparable stay at no extra cost, OR
  2. Offers a full refund + support.
- Scope and eligibility published in public terms.

Insurance partner selection: TBD. Claims operated by T&S.

---

## 8. Content moderation

Covered implicitly across modules:
- Listings ([§03](./03-listings.md)) — pre-publication moderation.
- Messages ([§07](./07-messaging.md)) — flagging for prohibited content + off-platform contact.
- Reviews ([§08](./08-reviews-ratings.md)) — post-publication moderation.

T&S owns the **policy**; those modules own the **flow**.

---

## 9. Data model

### `public.incidents`
| Column        | Type          | Notes                                           |
| ------------- | ------------- | ----------------------------------------------- |
| `id`          | `uuid`        |                                                 |
| `tier`        | `text`        | `P0` / `P1` / `P2` / `P3`                       |
| `type`        | `text`        | `safety` / `fraud` / `misrep` / `damage` / …    |
| `opened_by`   | `uuid FK`     | user or system                                  |
| `subject_user`| `uuid FK`     | who it's about                                  |
| `booking_id`  | `uuid FK`     | if applicable                                   |
| `state`       | `text`        | `open` / `in_progress` / `resolved` / `closed`  |
| `assigned_to` | `uuid`        | staff                                           |
| `opened_at`   | `timestamptz` |                                                 |
| `first_response_at` | `timestamptz` |                                           |
| `resolved_at` | `timestamptz` |                                                 |
| `outcome`     | `text`        |                                                 |
| `notes`       | `text`        | staff-only                                      |

### `public.incident_events`
Append-only timeline of actions on an incident (assignment, communication, evidence added, decision).

### `public.fraud_signals`
Per-entity (user, booking, listing, payment) score + factors + rule hits.

### `public.bans`
`user_id`, `scope` (guest / host), `reason`, `expires_at` (or null for permanent), `imposed_by`.

### `public.audit_log`
Append-only log of privileged actions by staff (role elevations, bans, refunds, listing removals).

---

## 10. API surface

- `POST /incidents` — open from guest SOS, in-app support, host report.
- `PATCH /incidents/:id` — staff state transitions.
- `POST /fraud/score` — internal pre-action check (new listing, booking, bank change).
- `POST /bans` — admin.
- `GET /audit-log` — admin with reason-filtering.

---

## 11. Edge cases & failure modes

- **SOS from a guest without a data connection.** SMS fallback with a short-code; voice fallback where available.
- **Incident raised from a timezone where concierge is thin.** Follow-the-sun rota ensures ≥1 tier-P0-ready human always.
- **Host appeals a wrongful suspension.** Formal appeal path, reviewed by a different analyst, capped to 14 days.
- **Mass incident (local disaster, flood, earthquake).** T&S proactively contacts all affected bookings; blanket re-book/refund policy enabled temporarily.
- **Compromised admin account.** Audit log + SSO / 2FA + session revocation + all admin actions reviewable by superadmin.
- **Legal / regulator contact.** Single designated responder; no ad-hoc responses.
- **Cross-border criminal report.** Cooperate with authorities per local law; respect user privacy where law permits.
- **Bad actor re-registers under new identity.** Device / payment / network fingerprint linking to detect.

---

## 12. KPIs

- **P0 first-response time** P50 / P95.
- **Dispute resolution time** P50 / P95.
- **Fraud loss rate** (% of GMV).
- **Host-protection payout timeliness**.
- **Ban-reversal rate on appeal** (sanity check on initial decisions).
- **Safety incident rate** per 1000 stays.

---

## 13. Dependencies

- [02 auth](./02-auth-identity.md) — verification data.
- [06 payments](./06-payments-payouts.md) — processor dispute hooks.
- [12 concierge](./12-concierge-support.md) — humans who act on incidents.
- [14 admin-ops](./14-admin-ops.md) — internal tooling.
- External: KYC vendor, reverse-image-search service, fraud-scoring (e.g. Sift / internal rules), insurance partner, local emergency-services directory.

---

## 14. v1 scope

- ✅ Audit log table live.
- ✅ Report-a-listing / report-a-review endpoints (stored; human triage post-v1).
- ✅ Basic fraud rules on signup (disposable email check, phone verification required).
- 🔲 Full incident console — **v2**.
- 🔲 SOS path — **v2** (no in-stay context yet in v1).
- 🔲 Insurance partner integration — **v2/v3**.
- 🔲 Dispute workflow — **v2**.

---

## 15. Open questions

- 🔲 Insurance partner (regional vs global; per-line vs bundled).
- 🔲 Fraud-scoring approach: rules engine only, third-party (Sift, Unit21), or hybrid.
- 🔲 SOS escalation to local law enforcement — what's our default posture?
- 🔲 How public are our safety stats? Airbnb doesn't share them; transparency could be a brand win.
- 🔲 Minor co-guests on bookings — policy around accompanying children.
- 🔲 Handling of short-term-let regulation in cities where it's restricted (Barcelona, NYC) — block listings, warn, or geofence?
