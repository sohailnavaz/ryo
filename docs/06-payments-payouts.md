# 06 · Payments & Payouts

> Money in, money out, in any currency, with honest pricing and on-time payouts.

| Field         | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Module ID     | `06-payments-payouts`                                                                       |
| Status        | ✏️ Draft                                                                                    |
| v1 scope      | **Mock payment** integration end-to-end. Real rails (Stripe + Razorpay) in v2.              |
| Owner         | TBD                                                                                         |
| Linked        | [05 bookings](./05-bookings.md), [11 trust-safety](./11-trust-safety.md), [13 host-tools](./13-host-tools.md), [14 admin-ops](./14-admin-ops.md) |
| Last updated  | 2026-04-24                                                                                  |

---

## 1. Purpose & Ryo alignment

Payments is where the brand promise "no dark patterns, no surprise fees" is either proven or destroyed. Total price must be visible, itemised, and stable. Payouts must be predictable and fast — our host-side promise. Money-handling is also the primary attack surface for fraud — tied tightly to [§11 trust-safety](./11-trust-safety.md).

---

## 2. User stories

### Guest
- As a guest, I want to pay with methods I already trust (card, Apple/Google Pay, UPI in India, wallets in select markets).
- As a guest, I want the total I see to be the total I pay.
- As a guest, I want refunds to hit my original method within a predictable window.
- As a guest, I want strong auth (3DS / OTP) when my bank requires it, without breaking the flow.

### Host
- As a host, I want payouts on a predictable schedule (24h after check-in by default).
- As a host, I want clear statements (bookings → net payout) with fee breakdown.
- As a host, I want tax documents at year-end.

### Ops
- As finance, I want daily reconciliation between bookings, captures, refunds, and payouts.
- As T&S, I want to freeze a payout under investigation.

---

## 3. Money-movement model 🔒

**Ryo holds funds in escrow from capture until 24h after check-in**, then releases to the host. This protects the guest's service guarantee (arrival protection, re-book) and the host from chargebacks during the stay.

```
Guest card → Ryo escrow (at confirm) → Host payout (check-in + 24h)
                    │
                    └→ Refund to guest (cancellation / dispute)
```

**Fees:**
- Guest service fee — transparent line on the receipt.
- Host service fee — deducted from payout, shown on statement.
- Total target take-rate: **~14–16%** blended (industry-comparable).

---

## 4. Supported methods

### v2 launch
| Region        | Methods                                                              |
| ------------- | -------------------------------------------------------------------- |
| India         | UPI (GPay, PhonePe, Paytm), Cards (Visa/MC/Rupay), NetBanking        |
| Global        | Cards (Visa/MC/Amex), Apple Pay, Google Pay                          |
| EU            | + SEPA, iDEAL, Bancontact                                            |
| SEA           | + GrabPay, local wallets (phase-based)                               |

### Payout rails (host)
| Region        | Rails                                                                |
| ------------- | -------------------------------------------------------------------- |
| India         | IMPS / NEFT / UPI payout                                             |
| Global        | ACH (US), SEPA (EU), Wise for long-tail                              |

---

## 5. Processor strategy ✏️

Dual-processor from day one:

- **Razorpay** — primary for India (UPI-native, local rails, GST integration).
- **Stripe** — global and EU/US, best FX, strong 3DS.

Routing rule: guest country → processor. FX and payout currency chosen at confirm.

---

## 6. Multi-currency

- Listings priced in **host currency** (stored).
- Guest sees prices in **their preferred currency**, converted at **display-time FX**.
- At confirm, FX is **pinned** (`fx_pinned_at`) for 15 min — the quote freeze.
- Ryo earns a small FX margin (e.g. 100–150 bps over mid-market); **disclosed** on the receipt.
- Host is paid in their currency; FX risk between capture and payout is Ryo's.

---

## 7. Tax handling ✏️

- **GST (India)**: collected on service fees; invoice includes GSTIN.
- **VAT (EU/UK)**: applied per country rules; MOSS-style filing.
- **US**: no federal VAT; city/county lodging tax where hosts or Ryo are statutorily the collector.
- Tax is a **separate line** on every receipt; never bundled.

Ops delegates tax-filing mechanics to an accounting partner; the platform's job is accurate collection + reporting.

---

## 8. Core flows

### 8.1 Capture at confirm
1. Booking `quoted` → guest confirms payment method.
2. For instant-book: **capture** at confirm.
3. For request-to-book: **authorise** at request; capture at host accept; void on host reject/timeout.

### 8.2 Refund on cancel
1. Compute refund per [§5 cancellation policy](./05-bookings.md#44-cancellation-guest-initiated).
2. Refund original method (card/UPI/etc.).
3. Visible timeline shown to guest (e.g. "3–7 business days on card").

### 8.3 Payout
1. Daily payout job runs for every booking where `check_in + 24h ≤ now AND payout_state = pending`.
2. Deduct host service fee + any adjustments → net payout.
3. Push payout via host's preferred rail; write receipt.
4. Failures (bad bank details, holds) surface in host dashboard + concierge ticket.

### 8.4 Dispute / chargeback
1. Processor notifies webhook.
2. State machine moves booking → `disputed`.
3. T&S assembles evidence (messages, reviews, logs); responds within processor's window.
4. Outcome logged; loss posted to `financial_adjustments`.

### 8.5 Split payout (v3+)
Reserved for multi-host properties or property managers — not v1/v2.

---

## 9. Data model

### `public.payments`
| Column               | Type          | Notes                                        |
| -------------------- | ------------- | -------------------------------------------- |
| `id`                 | `uuid`        |                                              |
| `booking_id`         | `uuid FK`     |                                              |
| `processor`          | `text`        | `stripe` / `razorpay` / `mock`               |
| `processor_intent_id`| `text`        |                                              |
| `state`              | `text`        | `requires_action` / `authorised` / `captured` / `refunded` / `failed` |
| `amount_minor`       | `int`         | Charge amount                                |
| `currency`           | `text`        |                                              |
| `fx_rate`            | `numeric`     | Pinned display-to-charge                     |
| `method_type`        | `text`        | `card` / `upi` / `apple_pay` / ...           |
| `last4`              | `text`        |                                              |
| `created_at`         | `timestamptz` |                                              |
| `captured_at`        | `timestamptz` |                                              |

### `public.refunds`
| `id`, `payment_id FK`, `amount_minor`, `reason`, `state`, `processor_ref`, `created_at` |

### `public.payouts`
| Column             | Type          | Notes                                         |
| ------------------ | ------------- | --------------------------------------------- |
| `id`               | `uuid`        |                                               |
| `host_id`          | `uuid FK`     |                                               |
| `booking_id`       | `uuid FK`     |                                               |
| `gross_minor`      | `int`         |                                               |
| `host_fee_minor`   | `int`         |                                               |
| `adjustments_minor`| `int`         | Negative for deductions                       |
| `net_minor`        | `int`         | Amount to host                                |
| `currency`         | `text`        |                                               |
| `state`            | `text`        | `pending` / `sent` / `failed` / `held`        |
| `rail`             | `text`        | `imps` / `ach` / `sepa` / `wise`              |
| `processor_ref`    | `text`        |                                               |
| `scheduled_for`    | `timestamptz` |                                               |
| `sent_at`          | `timestamptz` |                                               |

### `public.financial_adjustments`
Manual credits/debits: concierge goodwill credit, dispute loss, platform absorbs, tax correction.

### `public.payout_methods`
Host-provided: bank account, UPI VPA, account holder name. Stored with Supabase Vault / processor tokens — never raw.

### `public.tax_invoices`
Generated invoices per booking / per payout for host and guest jurisdictions.

---

## 10. API surface

- `POST /payments/intent` — create processor intent for a quoted booking.
- `POST /payments/confirm` — returns 3DS / OTP challenge or capture result.
- `POST /payments/refund` — guest / concierge / admin.
- `GET /payouts?host_id=` — host statements.
- `POST /payout_methods` — add/verify host method.
- `POST /webhooks/{stripe|razorpay}` — processor events.

All processor webhooks are **idempotent** and verified via signature.

---

## 11. Edge cases & failure modes

- **3DS failure.** Step-up challenge; if abandoned, quote released.
- **Double-capture race.** Idempotency keys on every intent-create/confirm.
- **Refund lag visibility.** Always show estimated date range; follow up via email on actual hit.
- **Declined payout.** Retry schedule (T+1, T+3, T+7); concierge notifies host at T+1.
- **Currency rounding.** Use minor-units integer math end-to-end; never floats.
- **Partial refunds + FX movement.** Refund in charge currency at original FX; no re-quote.
- **Card stolen post-stay.** Chargeback → T&S investigation → host protected by [§11](./11-trust-safety.md) host-damage policy.
- **Host changes bank details mid-cycle.** Payout held pending verification.
- **Platform insolvency / trust breach.** Escrow funds should sit in a segregated account — legal review.

---

## 12. KPIs

- **Payment success rate** (attempted → captured).
- **3DS drop-off**.
- **Refund-to-card latency** P50 / P95.
- **On-time payout rate** (target 99%+).
- **Take-rate actual vs target**.
- **Chargeback rate** (target < 0.5% of GMV).
- **FX margin realisation**.

---

## 13. Dependencies

- [05 bookings](./05-bookings.md) — money moves on booking events.
- [11 trust-safety](./11-trust-safety.md) — disputes, fraud rules.
- [02 auth](./02-auth-identity.md) — KYC required before first payout.
- **Processors**: Stripe + Razorpay.
- **Bank rails**: IMPS/NEFT/UPI, ACH, SEPA, Wise (long-tail).
- **Accounting partner** (TBD) for tax filing.

---

## 14. v1 scope

- ✅ Mock-payment processor adapter (simulated capture/refund, deterministic test cards).
- ✅ Booking total math (nightly + cleaning + service + tax, minor-units).
- ✅ Refund flow for Flexible-policy cancellations.
- ✅ Receipt generation (basic PDF or HTML).
- 🔲 Real processors (Stripe, Razorpay) — **v2**.
- 🔲 Payouts — **v2**.
- 🔲 Multi-currency display — partially (stub FX table in v1; live rates v2).
- 🔲 Tax invoices — **v2**.

---

## 15. Open questions

- 🔲 Which escrow structure is tax-and-legally cleanest per jurisdiction?
- 🔲 Guest-service fee refundability across all policies (brand-honesty argument).
- 🔲 Host-side payout cadence beyond T+24h (weekly rollup vs per-booking).
- 🔲 BNPL for high-value long stays — partner or ignore?
- 🔲 Wallet / gift-credit primitive (for concierge goodwill and referrals).
