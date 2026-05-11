# 00 · Ryo Overview

> **Ryo is a short-term-stays platform where travellers are hosted, not just accommodated.** We are building the better-service alternative to Airbnb.

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Module ID     | `00-overview`                                                                |
| Status        | ✏️ Draft                                                                     |
| v1 scope      | Company-level context — informs every other module                           |
| Owner         | Founders                                                                     |
| Linked        | [branding.md](./branding.md), all numbered modules                           |
| Last updated  | 2026-04-23                                                                   |

---

## 1. Why Ryo exists

Airbnb scaled the *idea* of home-sharing, but as it scaled the *hosting* became transactional: cleaning fees grew, support became scripted, trust became a policy page, and guests started asking "why didn't I just book a hotel?"

Ryo exists to rebuild short-term rentals around **service quality** — verified hosts, 24/7 multilingual concierge, honest pricing, curated listings, and real guarantees when things go wrong. The brand promise is captured by our tagline: ***Just Ryo it.*** (see [branding §5.1](./branding.md#51-tagline-))

---

## 2. Who we serve

### 2.1 Guests
Travellers (28–50, medium-to-high income, 3–10 trips a year) who have been burned by Airbnb at least once and are willing to pay a small premium for reliability. They use Ryo for:
- **Vacations** (leisure stays, family trips)
- **Work / bleisure trips** (a stay that also doubles as a home office)
- **Staycations** (weekend resets close to home)
- **Friend / group trips** (shared-stay reliability)
- **Solo escapes** (safety and support matter most)

### 2.2 Hosts
Owners or operators of 1–10 properties who take hospitality seriously and want a platform that **protects their home and their name**. They are frustrated with opaque ranking, slow payouts, and noise-guest risk on existing platforms.

### 2.3 Concierge team (internal)
Multilingual staff running 24/7 support — the humans behind the service guarantee. Their tooling is a first-class product (see [§12 concierge-support](./12-concierge-support.md)).

---

## 3. Positioning & differentiators 🔒

From [branding §3.3](./branding.md#33-differentiators-the-better-than-airbnb-axes-):

1. **Verified hosts** — real vetting, not a self-checked box.
2. **24/7 multilingual concierge** — a human answers, in your language, within SLA.
3. **Service guarantees** — arrival protection, re-book protection, quality refunds.
4. **Curation** — boutique-tier listings surfaced first, editorial presentation.
5. **Calm, trustworthy UI** — no dark patterns, clear pricing up-front, no surprise fees.

---

## 4. Product pillars → module map

| Pillar                                    | Primary modules                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| **Identity & trust**                      | [02 auth](./02-auth-identity.md), [11 trust-safety](./11-trust-safety.md)     |
| **Supply (listings & hosts)**             | [03 listings](./03-listings.md), [13 host-tools](./13-host-tools.md)          |
| **Demand (search & book)**                | [04 search](./04-search-discovery.md), [05 bookings](./05-bookings.md)        |
| **Money movement**                        | [06 payments-payouts](./06-payments-payouts.md)                               |
| **Communication**                         | [07 messaging](./07-messaging.md), [09 notifications-mail](./09-notifications-mail.md) |
| **Quality signal**                        | [08 reviews-ratings](./08-reviews-ratings.md)                                 |
| **Differentiator — service**              | [12 concierge-support](./12-concierge-support.md)                             |
| **Globalization**                         | [10 i18n-localization](./10-i18n-localization.md)                             |
| **Operations**                            | [14 admin-ops](./14-admin-ops.md)                                             |

---

## 5. v1 MVP scope (guest-only flow)

v1 ships as a credible **guest experience** end-to-end, with the backend primitives that later phases will build on.

**In v1:**
- Guest accounts, auth, profile, favorites, trips
- Listings browsing (seeded — no host-side self-serve creation yet)
- Search + filters + map
- Listing detail + photo gallery
- Booking with **mock payment** (real payments deferred)
- i18n scaffolding + 2–3 core locales
- Transactional email for booking confirmations
- Basic review display (read-only in v1)

**Deferred to v2+:**
- Host onboarding, listing creation, host dashboard
- Real payments + payouts + multi-currency
- Two-way messaging
- Review submission
- Concierge console + 24/7 support operation
- Trust & safety ops tools
- Admin console

> This split is deliberate: v1 validates the *guest experience promise* (calm, trustworthy, fast). Once that lands, we add the supply side.

---

## 6. Company-level KPIs

North-star metric candidates (pick one once v1 is live):

- **Rebook rate** — % of guests who book a second Ryo stay within 12 months. Proxy for real service quality.
- **NPS after stay** — measured at +7 days post-checkout.
- **Concierge resolution time** — P50 and P95; proof that we are faster than Airbnb support.

Supporting metrics per module are listed in each module doc.

---

## 7. Non-goals (for clarity)

Ryo is deliberately **not**:
- A booking engine for hotels.
- A long-term rental platform.
- A discount-first marketplace competing on price.
- A property-management SaaS (host tools support our supply, they are not the product).
- A home-exchange / house-swap service.

If a feature proposal drifts into any of the above, revisit this section before approving.

---

## 8. Open questions

- 🔲 Launch markets: India + Southeast Asia leaning, not yet locked.
- 🔲 North-star metric pick.
- 🔲 Host-side v2 scope and timing.
- 🔲 Legal entity structure (single India entity vs multi-jurisdiction).
- 🔲 Funding path (bootstrap vs seed) and implications for v2 scope.

---

## 9. References

- [branding.md](./branding.md) — brand bible
- [project memory: Ryo brand identity](../../.claude/projects/-Users-sohailshaik-Desktop-bnb/memory/project_ryo_brand.md)
- [project memory: bnb project overview](../../.claude/projects/-Users-sohailshaik-Desktop-bnb/memory/project_bnb_overview.md)
