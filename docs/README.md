# Ryo — Documentation Index

Welcome to the Ryo company and product documentation. This folder is the **source of truth** for every business module, product capability, and brand decision.

The docs are designed to survive UI iteration. Screens will change constantly; the *capability*, *data model*, and *promise* of each module stay anchored here.

---

## How to use this folder

- **[branding.md](./branding.md)** — the Ryo brand bible (living, versioned, authoritative for all brand decisions).
- **[BUSINESS_MODEL.md](./BUSINESS_MODEL.md)** — investor / partner handout. What Ryo is, how it makes money, the path. Forward-friendly.
- **Numbered files (00–14)** — business / product modules. Each is **UI-agnostic**: it defines *what Ryo does*, not *how the screen looks*. When the UI changes, the module doc does not.
- Every module doc follows the same template: Purpose · User Stories · Core Flows · Data Model · API Surface · Edge Cases · KPIs · Dependencies · v1 Scope · Open Questions.

---

## Index

| #  | Module                                                   | Purpose                                                                       |
| -- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| —  | [branding.md](./branding.md)                             | Brand identity, voice, visual system, tagline, design ethos                   |
| 00 | [overview.md](./00-overview.md)                          | Company-level vision, positioning, differentiators, success metrics           |
| 02 | [auth-identity.md](./02-auth-identity.md)                | Accounts, KYC, host verification, sessions, roles                             |
| 03 | [listings.md](./03-listings.md)                          | Listing creation, curation, quality tiers, calendars, pricing                 |
| 04 | [search-discovery.md](./04-search-discovery.md)          | Search, filters, map, personalization                                         |
| 05 | [bookings.md](./05-bookings.md)                          | Booking lifecycle, instant-book, modifications, cancellations                 |
| 06 | [payments-payouts.md](./06-payments-payouts.md)          | Payments, multi-currency, escrow, host payouts, taxes                         |
| 07 | [messaging.md](./07-messaging.md)                        | Guest↔host chat, auto-translate, concierge co-pilot                           |
| 08 | [reviews-ratings.md](./08-reviews-ratings.md)            | Two-way reviews, verified-stay only, moderation                               |
| 09 | [notifications-mail.md](./09-notifications-mail.md)      | Email, push, SMS, in-app; worldwide deliverability                            |
| 10 | [i18n-localization.md](./10-i18n-localization.md)        | Languages, RTL, currency, region rules                                        |
| 11 | [trust-safety.md](./11-trust-safety.md)                  | Verification, disputes, fraud, SOS, insurance                                 |
| 12 | [concierge-support.md](./12-concierge-support.md)        | 24/7 multilingual concierge — **the Ryo differentiator**                      |
| 13 | [host-tools.md](./13-host-tools.md)                      | Host dashboard, calendar sync, analytics, payouts                             |
| 14 | [admin-ops.md](./14-admin-ops.md)                        | Internal admin console, moderation, finance, audit                            |

> No `01` file — the brand bible at [branding.md](./branding.md) occupies that slot by design, since it changes on its own cadence and has its own living-doc conventions (see [§17](./branding.md#17-how-to-update-this-document)).

---

## Status legend (same as branding doc)

- 🔒 **Locked** — decided; do not change without a changelog entry
- ✏️ **Draft** — active; open to revision
- 🔲 **TBD** — placeholder; decision pending

---

## Core principles that apply to every module

1. **Service is the product.** Every module should make hospitality easier, not merely cheaper or faster. When a trade-off appears between volume and quality, choose quality.
2. **UI will change; capabilities will not.** Write specs in functional terms (what, why, for whom) — not in visual terms. Keep the data model, the API surface, and the user stories stable.
3. **i18n and worldwide deliverability from day one.** Every user-visible string is localizable. Every email and SMS is locale-routed. Every date/time/currency is formatted per locale.
4. **Trust is earned.** Every module considers verification, fraud, edge cases, and failure modes explicitly — not as an afterthought.
5. **Calm over clever.** Modules optimize for low anxiety. Clear pricing, honest status, quiet defaults.

---

## How to add or update a module doc

1. Follow the template used by existing module docs.
2. When adding a new module, update this index and open a note in the relevant module's "Dependencies" section.
3. Every module has an **Open Questions** section — track unresolved decisions there so nothing gets lost.
4. Mark every section with a status marker (🔒 / ✏️ / 🔲).
5. Version the module doc with semver at the top if the change is non-trivial.
