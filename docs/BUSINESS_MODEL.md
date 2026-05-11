---
doc: BUSINESS_MODEL
purpose: Investor / partner / team handout. One-pager-style summary of the Ryo business — what it is, how it makes money, what the path looks like. Safe to forward.
last_updated: 2026-04-25
version: 0.1.0
---

# Ryo — Business Working Model

> ### *Just Ryo it.*
> A short-term-stays platform where travellers are **hosted**, not just accommodated.

| | |
|---|---|
| **Owner** | Makuta Developers |
| **Contact** | dm@makutadevelopers.com |
| **Stage** | v1 in build (guest-only flow, mock payments). v2 expands to host tooling + concierge ops. |
| **Brand bible** | [branding.md](./branding.md) |
| **Product specs** | [README.md](./README.md) (14 modules) |
| **Status** | [PROGRESS.md](./PROGRESS.md) |

---

## 1. The problem

Airbnb scaled the *idea* of home-sharing, but as it scaled the *hosting* became transactional:

- **Surprise fees** at checkout that don't show in search.
- **Slow, scripted support** when something goes wrong on the day.
- **Unreliable hosts** — no real vetting, cancellations close to arrival, listings that don't match photos.
- **No real recourse** — service issues turn into a refund argument, not a fix.

A growing share of travellers — leisure and bleisure — are now asking *"why didn't I just book a hotel?"* The answer should be obvious. It isn't.

---

## 2. The product

Ryo rebuilds short-term rentals around **service quality**:

| Pillar | What it means |
|---|---|
| **Verified hosts** | Real KYC + property-right proof. Boutique-tier listings get an on-site inspection. |
| **24/7 multilingual concierge** | A human answers in ≤2 minutes on chat / ≤30 seconds on phone, in the guest's language. *Omotenashi* operationalised. |
| **Service guarantees** | Arrival protection, re-book protection, quality refunds — funded out of service fees. |
| **Curation** | Boutique listings surfaced first; quality > volume. |
| **Calm, honest UI** | Total price up-front. No dark patterns. No urgency manipulation. |

For travellers Ryo is a stay that feels *prepared for them*. For hosts it is a platform that **protects their home and their name**.

---

## 3. Who Ryo is for

### Guests (primary demand)
- **28–50, medium-to-high income**, travels 3–10 times a year.
- Mix of **vacations, bleisure, staycations, friend trips, family, solo escapes**.
- Has been burned by Airbnb at least once. Willing to pay a small premium for reliability.

### Hosts (primary supply)
- Owners or operators of **1–10 properties** who take hospitality seriously.
- Frustrated with opaque ranking, slow payouts, noise-guest risk on existing platforms.

### Concierge team (internal)
- Multilingual staff running 24/7 support. Their tooling is a first-class product, not a back-office.

---

## 4. How Ryo makes money

### 4.1 Take rate
**Blended ~14–16% per booking**, split between guest and host:

| Fee | Paid by | Typical rate | Visible? |
|---|---|---|---|
| **Guest service fee** | Guest | 8–11% of subtotal | Yes — line on receipt, before checkout |
| **Host service fee** | Host | 5–8% of payout | Yes — line on host statement |
| **FX margin** | Guest (when paying in a different currency) | ~100–150 bps over mid-market | Yes — disclosed on receipt |

> Total price the guest sees at search = **what they pay**. No surprise add-ons. This is a brand promise, not a tactic.

### 4.2 Escrow model
Funds are held by Ryo from capture until **24 h after check-in**. This is what makes the service guarantees possible — if the stay fails on arrival, the guest can be made whole without a chargeback fight.

### 4.3 Unit economics — illustrative
*Numbers below are model assumptions, not committed.*

| Metric | Value |
|---|---|
| Average nightly rate (across launch markets) | **~$280** |
| Average stay length | **4 nights** |
| Average booking value | **~$1,120** |
| Blended take rate | **~15%** |
| Average revenue per booking (ARPB) | **~$168** |
| Concierge cost per booking | **~$8–14** |
| Payment + FX cost | **~3% of GMV** |
| Refund + guarantee absorption | **~1.5% of GMV** budgeted |
| Estimated contribution margin per booking | **~50–60% of ARPB** |

Brand discipline: **paid-placement is off**. Hosts cannot pay to outrank. Take rate is the only revenue stream in v1–v3.

---

## 5. Why this beats Airbnb on its own ground

We are not competing on volume. We are competing on **service consistency** — the one thing Airbnb's scale model can't deliver.

| Axis | Airbnb | Ryo |
|---|---|---|
| Listings | Infinite | Curated; Boutique tier surfaced |
| Host verification | Self-attested | Real KYC + property right |
| Support SLA | Hours, often days, scripted | **≤2 min chat / ≤30 s phone**, 24/7, multilingual |
| Pricing transparency | Cleaning fee + service fee added at checkout | Total price visible at search |
| Re-book protection | Inconsistent | Standard guarantee |
| Trust posture | "We're a marketplace" | "We stand behind every stay" |

Result for the guest: a booking they don't have to babysit.
Result for the host: a platform that backs them when guests are unreasonable, and protects their property and name.

---

## 6. Market

- **Global short-term-rental GMV**: ~$120 B+ (2025), growing high-single-digits.
- **Indian + SEA short-term-rental GMV**: rising fast off a smaller base — younger travellers, more weekend-trip behaviour, lower trust in existing platforms.
- **Premium / curated tier within that** (our wedge): smaller in count but higher AOV and far better unit economics.

We launch where the unit economics are best (India + SEA) and expand outward as supply quality scales.

---

## 7. Go-to-market

### Phase 1 — Launch (v1 + early v2)
- **Geography**: India + Southeast Asia.
- **Supply strategy**: hand-curated boutique launch supply (~200–500 listings) — quality bar from day one.
- **Demand strategy**: founder-led + community + brand content. *Just Ryo it.* as the anchor line.
- **Service signal**: publish SLAs. Service quality becomes the marketing.

### Phase 2 — Scale (v2 → v3)
- Expand to neighbouring markets where Indian/SEA travellers go (Sri Lanka, Indonesia, UAE, Japan).
- Open host self-serve onboarding once supply ops are tested.
- Add paid acquisition only after **rebook-rate** signal is positive.

### Phase 3 — Global posture
- Multi-region payments, multi-language concierge, multi-currency settlement already in place by design.
- Expansion is operational, not architectural — i18n + payments + concierge tooling are built from day one.

---

## 8. Roadmap

| Phase | Status | Highlights |
|---|---|---|
| **v1 — guest experience** | In build (M0–M6 code landed, live-verify pending) | Auth, explore, search, listing detail, booking with mock payments, trips, profile, favorites |
| **v1 — v2 preview** | ✅ Live now at `/host` + `/admin` | Host dashboard + maintenance/ops dashboard with synthetic data — for UX validation |
| **v2 — supply + payments** | Queued | Host KYC, listing creation, real payments (Stripe + Razorpay), payouts, two-way messaging, concierge desk |
| **v2 — service launch** | Queued | 24/7 multilingual concierge live, SLAs published, guarantee programmes funded |
| **v3 — scale** | Queued | Self-serve host onboarding, multi-region payment rails, partner integrations |

Full module-by-module specs: [docs/README.md](./README.md).

---

## 9. Defensibility

1. **Brand promise + service operations** — "*Just Ryo it.*" is backed by an SLA-driven concierge function that competitors can't bolt on retroactively.
2. **Curation discipline** — refusing low-quality supply hurts short-term GMV but builds a quality moat the volume players can't match without diluting their own brand.
3. **Trust architecture** — verification + escrow + guarantees are baked into the data model and the money flow, not policy pages.
4. **Localisation depth** — i18n / RTL / multi-currency / region-aware compliance are foundational, not retrofits. Cross-border travel is the natural shape of Ryo.

---

## 10. Risks (and how we hold them)

| Risk | Mitigation |
|---|---|
| Concierge cost rises faster than GMV | Tier the guarantee (Boutique vs Standard), automate routine triage with AI assistance — keep humans on the irreplaceable moments. |
| Supply scarcity in launch markets | Open with a tight geo focus + hand-curated supply; refuse to lower the bar to fill the page. |
| Regulatory pressure in short-let cities | Geo-detect; warn at list-time; cooperate with city authorities; design for compliance from day one. |
| Brand bleeds into "premium = expensive" perception | Hold the line on transparent total-price as the primary brand cue, not exclusivity signals. |
| Trust incident | T&S is a first-class product, not a policy page. Insurance partner + escrow + audit trail bound the worst-case. |

---

## 11. Team & contact

| | |
|---|---|
| Operator | Makuta Developers (founder-led) |
| Email | dm@makutadevelopers.com |
| Project repo (private) | `/Users/sohailshaik/Desktop/bnb` — codename `bnb`, brand `Ryo` |
| Domains targeted | `ryo.stay` · `ryostays.com` · `ryo.co.in` · defensive `joinryo.com` / `tryryo.com` |

---

## 12. One-sentence summary

> **Ryo is a short-term-stays platform that makes hospitality the product — verified hosts, 24/7 multilingual concierge, honest pricing, real guarantees. *Just Ryo it.***

---

*This document is a living handout. Pull-requests welcome; canonical source is [`docs/BUSINESS_MODEL.md`](./BUSINESS_MODEL.md). For brand specifics see [branding.md](./branding.md); for module-level specifications see the [docs index](./README.md).*
