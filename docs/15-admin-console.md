# 15 · Admin Console & Analytics — build spec

> The control room. This is the **implementation-grade** spec — [§14 admin-ops](./14-admin-ops.md) states *what* the console is for; this states *how it is built* so that it survives a hundred thousand rows, a real audit, and a real employee who is not you.

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Module ID     | `15-admin-console`                                                                     |
| Status        | 📐 Spec — approved for build, no code written yet                                       |
| Extends       | [14-admin-ops](./14-admin-ops.md) · [06-payments-payouts](./06-payments-payouts.md) · [11-trust-safety](./11-trust-safety.md) · [12-concierge-support](./12-concierge-support.md) |
| Supersedes    | §14's "v1 scope: not in v1, use Supabase studio"                                        |
| Last updated  | 2026-07-13                                                                             |

---

## 0. Decisions locked

Taken in the 2026-07-13 architecture review. These are inputs to everything below; change them here, not in code.

| # | Decision | Consequence |
|---|---|---|
| D1 | **Build the scale architecture now**, ahead of the volume. | Search index, read replica, event spine, keyset pagination from day one. No "we'll fix the table later." |
| D2 | **Revenue is derived; cost is entered.** Revenue computes from real bookings. Marketing spend, host share, salaries, infra are **entered** (with recurring + budget support) so the P&L is real. | An `expenses` + `budgets` + `ledger` model, not a GMV chart. |
| D3 | **Admin-only today; role-ready by design.** No employees yet, so everyone is `admin` — but the permission matrix ships as **data**, so hiring someone is a row in a table, not a refactor. | `role_permissions` table + RLS from day 1. |
| D4 | **Spec before code.** | This document. |

---

## 1. Principles — the anti-vibe rules

These are the seven rules that separate an operations console from a generated CRUD panel. Every section below is downstream of them.

1. **Nobody browses.** Operators search, or they work a queue. A screen whose default state is "all rows" is a database browser, and a database browser is not a product. The default view of every list surface is a **named segment** that answers a question someone actually has.
2. **Read-only by default.** The console reads. Writing is an *action* — reasoned, confirmed, audited, idempotent, and reversible where physics allows.
3. **One event spine.** Every screen is a read over one append-only stream of facts. Screens do not each invent their own counters.
4. **The console acts; the warehouse explains.** Transactional ops and analytical questions have different latency, different access patterns, and different failure modes. They do not share a query.
5. **No number is computed in React.** If a metric appears on two screens it has one definition, in one place, in SQL. A metric without a single owning definition is a lie you tell twice.
6. **PII is masked by default.** Unmasking is itself an audited action, not a page load.
7. **Every list surface uses one primitive.** Built once, correctly. There is no second table component.

---

## 2. Surface map — everything the console contains

Status against the code as of 2026-07-13: ✅ built · 🟡 shell (renders, doesn't persist or doesn't scale) · ⬜ missing.

### A. Command & navigation
| Surface | Status | Notes |
|---|---|---|
| **⌘K omnibox** | ⬜ | *The* primary navigation. Resolves email, phone, user id, booking ref, listing id, incident id, payment id, or a fuzzy name → straight to the inspector. Also runs commands ("suspend user…", "refund booking…"). Keyboard-first is most of what makes a console feel professional. |
| Global search page | 🟡 | Exists (`AdminSearchScreen`) but is client-side over synthetic data. Becomes a fallback surface once ⌘K lands. |
| Saved views / segments | ⬜ | Shared, named, per-resource. See §3. |

### B. Entity inspectors
Every inspector carries the same four tabs — **record · timeline · linked entities · audit trail** — so an operator learns the shape once.

| Surface | Status |
|---|---|
| User inspector | ✅ (synthetic) |
| Booking inspector | ✅ (synthetic) |
| **Host inspector** | ⬜ — you can moderate a host's listing but not open the host |
| **Listing inspector** | ⬜ — moderation queue has no "open the full listing with its history" |
| **Payment / transaction inspector** | ⬜ — blocked on real payments |
| Incident inspector | 🟡 — client-side store |

### C. Queues — work that arrives at you
Every queue shares one grammar: **filters · assignment · SLA clock · bulk action (capped) · "why is this here"**.

| Queue | Status |
|---|---|
| Listing moderation | ✅ (client-side) |
| Review moderation | ✅ (client-side) |
| Incidents / disputes | ✅ (client-side) |
| **Host KYC / verification review** | ⬜ — `host-verification-store.ts` exists guest-side; nobody reviews it |
| **Fraud review** | ⬜ |
| **Payout exceptions** (failed / held) | ⬜ |
| **Chargeback response** (deadline-driven) | ⬜ |
| **Refund approvals** above threshold | ⬜ |
| **Appeals** | ⬜ — a suspended user must be able to contest. Without this you have no due process, which is both unfair and a regulatory exposure in the EU. |

### D. Trust & Safety — the weakest domain today
| Surface | Status | Notes |
|---|---|---|
| Risk score on user + booking | ⬜ | Feature-based score, explainable ("why 82?"), not a black box. |
| **Account-linking graph** | ⬜ | Same device / card / IP / phone across accounts. This is how you catch a banned host returning under a new email. Without it, suspension is theatre. |
| Rules engine | ⬜ | Tunable thresholds without a deploy. Rules emit queue items with a provenance string. |
| Ban / sanctions list | ⬜ | Hashed identifiers, so a re-signup is caught at registration. |
| **SOS console** | ⬜ | Guest in danger mid-stay. Non-optional given a 24/7 concierge promise. |

### E. Finance — see §6 in full
Revenue · **Expenditure** · P&L + unit economics · Ledger · Payouts · Reconciliation · Chargebacks · Tax. Today: one synthetic GMV chart.

### F. Supply operations
Listing quality tiers · pricing & promo tools · availability integrity (calendars that lie) · host performance scorecard · **at-risk host cohort** (a host with zero bookings 30 days after going live is about to churn — that's a save-able moment, and only a console can surface it).

### G. Demand operations
Search relevance & ranking config · **zero-result search review** (the cheapest supply-gap signal you will ever get) · promo codes & campaigns · referral-fraud watch.

### H. Concierge desk — the differentiator, entirely unbuilt
Unified inbox (guest + host + channel) · **authorized actions from inside the conversation** (an agent should never tab-hop to refund) · macros · SLA board · AI-drafted replies with a human approve step · handoff + escalation. Spec'd in [§12](./12-concierge-support.md).

### I. Platform
Feature flags ✅ (needs %/region/cohort targeting) · **experiments** ⬜ (flags without experiments are just switches) · release console + rollback ⬜ · system health ✅ (synthetic) · **job queues with a dead-letter view** ⬜ · maintenance windows ⬜.

### J. Governance
Audit log 🟡 (client-side) · **staff SSO + mandatory 2FA** ⬜ · role matrix ⬜ · **break-glass elevation** ⬜ (time-boxed, alerting) · reason-code registry ⬜ · **data-subject requests** ⬜ (GDPR/DPDPA export + delete — a legal requirement the day you take one EU or Indian user) · retention policy ⬜.

### K. Analytics
**Embedded, not hand-built.** See §7.

---

## 3. The list primitive — the fix for the Users page

### What is wrong today

[`AdminUsersScreen.tsx`](../packages/features/src/admin/AdminUsersScreen.tsx) fetches **every** user, filters in memory, and maps **every** row into the DOM. At 100 users this looks fine; at 50,000 it downloads 50,000 records and mounts 50,000 views, and the tab dies. The subtitle — *"Every account on file"* — names the design flaw out loud: it's a database browser.

But performance is the smaller half. The larger half is that **"all users" is a question nobody asks.**

### The contract

One component, `<AdminTable>`, driving one hook, used by every list surface in the console. Non-negotiable properties:

**Server-driven, always.** No client-side filtering, sorting, or paging exists anywhere in the console.

```ts
useAdminList({
  resource: 'users',
  view:     'hosts_pending_kyc',   // named segment (the default is never "all")
  filters:  { market: 'IN', risk: ['high'] },
  sort:     { field: 'created_at', dir: 'desc' },
  cursor:   'eyJjcmVhdGVkX2F0IjoiMjAyNi0wNy0xMSJ9',  // keyset, not offset
  columns:  ['user', 'role', 'kyc', 'risk', 'ltv', 'last_active'],
  limit:    50,
})
// → { rows, nextCursor, facets, approxTotal, provenance }
```

**Keyset pagination, not offset.** `OFFSET 50000` makes Postgres walk 50,000 rows *and* silently skips or repeats records when the underlying data mutates between pages — which, in a live ops console, it constantly does. Paginate on `(sort_key, id)`.

**Never `count(*)` for a badge.** On a large table it is a full scan. Use `reltuples` estimates for the "≈12,400 users" display and an exact count only inside a narrow filtered segment where it's cheap.

**Facets carry counts.** The filter rail shows `Suspended (12) · Pending KYC (48) · High risk (3)` — the counts *are* the value; a filter list without them makes the operator guess.

**Virtualized rows** above a 50-row threshold. Render what's visible.

**Saved views are first-class objects**, not local state:

```sql
create table public.admin_views (
  id          uuid primary key default gen_random_uuid(),
  resource    text not null,             -- 'users' | 'bookings' | 'listings' | …
  name        text not null,             -- 'Hosts pending KYC'
  definition  jsonb not null,            -- filters + sort + columns
  owner_id    uuid references profiles(id),
  is_shared   boolean not null default false,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
```

**Bulk actions** are capped (hard limit, e.g. 500), show a **blast-radius preview** before executing — *"suspends 1 host, cancels 4 upcoming bookings worth ₹86,000, notifies 4 guests"* — and require a second approver above a threshold (§5).

**Export is a job**, never a synchronous button. It enqueues, runs, emails a signed expiring link, and writes an audit row. A CSV of every user is the single most likely way you lose your database.

**Row provenance.** Any row surfaced by a rule explains itself: *"flagged by rule `payment_velocity_v2` · 4 cards in 24h"*.

**Keyboard.** `/` focuses filter · `j`/`k` move · `↵` opens · `x` selects · `⌘K` anywhere.

### Users, respecified

The page stops being "every account on file" and becomes a set of **segments**:

| Segment | Question it answers |
|---|---|
| Hosts pending KYC | What's blocking supply from going live? |
| Suspended (last 7d) | What did we do this week, and was it right? |
| High risk | Who is about to cost us money? |
| Open incident | Who is currently having a bad time? |
| New hosts, 0 bookings, 30d+ | Who is about to churn while we can still save them? |
| Top 100 by LTV | Who deserves the concierge's attention? |
| *All users* | (rarely opened — the escape hatch, not the front door) |

**This is the pattern, and it is not about users.** It is reused verbatim for bookings, listings, payouts, incidents, and expenses. Build it once.

---

## 4. Roles & access control

Today every staff member is `admin` — because there is one of you. The point of specifying the full matrix **now** is that it ships as *data*, so the first hire is an `INSERT`, not a refactor.

### Role model

| Role | Owns | Cannot |
|---|---|---|
| `guest` | — | anything staff |
| `host` | own listings, calendar, payouts | anything staff |
| `support` | own tickets, guest comms, credits ≤ threshold | finance, roles, bulk actions |
| `moderator` | listing + review queues | money, PII beyond the item, suspensions |
| `trust_safety` | risk, fraud, suspensions, account graph, appeals | payouts, expenses |
| `finance` | ledger, payouts, refunds, expenses, P&L | user PII beyond what a payment requires |
| `ops_manager` | **approvals** (the second pair of eyes), all queues | role grants |
| `analyst` | aggregate read-only | any PII, any write |
| `admin` | everything, incl. role grants, break-glass | — (but is fully audited) |

### Enforced as data, not as `if` statements

```sql
create table public.role_permissions (
  role        text not null,
  resource    text not null,        -- 'users' | 'expenses' | 'payouts' | …
  can_read    boolean not null default false,
  can_act     boolean not null default false,
  can_approve boolean not null default false,
  pii_level   text not null default 'masked',  -- 'none' | 'masked' | 'full'
  primary key (role, resource)
);
```

RLS policies key off this table via `is_staff()` (already shipped in `0003_roles.sql`) plus a `can(role, resource, action)` SQL helper. **A permission check never lives in the client.** The client hides buttons for UX; the database refuses the write.

### The rest of the access story

**SSO + mandatory 2FA** on every staff account (Google Workspace + TOTP/passkey). **Break-glass**: `admin` can elevate for a fixed window with a written reason; it alerts on trigger and is reviewed within 24h; target usage is near-zero and a rising rate is itself a signal. **PII masking** by tier — emails and phones render as `n•••@ryo.com` until an operator explicitly unmasks, which writes an audit row. **Four-eyes approval** required above thresholds:

| Action | Threshold requiring a second approver |
|---|---|
| Refund / credit | > ₹25,000 (or equivalent) |
| Payout release (held) | any |
| Bulk action | > 50 entities |
| Role grant | any above `support` |
| Expense entry | > ₹100,000 |

---

## 5. The event spine + the mutation contract

### Two append-only tables, different jobs

**`events` — analytics.** Facts about what happened. High volume, partitioned by month, feeds every metric.

```sql
create table public.events (
  id           bigserial,
  occurred_at  timestamptz not null default now(),
  name         text not null,          -- 'booking.confirmed'  (noun.past_tense)
  actor_id     uuid,
  actor_role   text,
  subject_type text,                   -- 'booking'
  subject_id   text,
  payload      jsonb not null default '{}',
  source       text not null,          -- 'web' | 'mobile' | 'server' | 'admin' | 'system'
  session_id   text,
  request_id   text,
  ip           inet,
  primary key (id, occurred_at)
) partition by range (occurred_at);
```

**`audit_log` — governance.** Only staff mutations. Low volume, **hash-chained** so it is tamper-evident, and never deleted.

```sql
create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  seq           bigserial unique,
  actor_id      uuid not null references profiles(id),
  actor_role    text not null,
  action        text not null,             -- 'user.suspend'
  subject_type  text not null,
  subject_id    text not null,
  reason_code   text not null references reason_codes(code),
  note          text,
  before        jsonb,
  after         jsonb,
  blast_radius  jsonb,                     -- what the dry-run said it would touch
  prev_hash     text not null,             -- hash of the previous row
  hash          text not null,             -- sha256(seq || actor || action || … || prev_hash)
  created_at    timestamptz not null default now()
);
```

The hash chain is what makes the log *evidence* rather than a list. Anyone who edits a historical row breaks every hash after it, and a nightly job verifies the chain.

**Events explain. Tables decide. Audit proves.** State is never derived by replaying events — state lives in ordinary tables. Events exist so you can answer questions you didn't think to ask when you built the screen.

### Canonical event taxonomy (v1)

Named once, `noun.past_tense`, and never renamed:

`search.performed` · **`search.zero_results`** · `listing.viewed` · `listing.submitted` · `listing.approved` · `listing.rejected` · `booking.started` · `booking.confirmed` · `booking.cancelled` · `payment.captured` · `payment.refunded` · `payout.sent` · `payout.failed` · `review.submitted` · `incident.opened` · `incident.resolved` · `message.sent` · `concierge.replied` · `concierge.deflected` · `user.signed_up` · `user.suspended` · `flag.toggled` · `expense.recorded`

### One write path for every privileged action

No admin screen writes to a table. They all call one server-side function:

```ts
adminAction({
  action:          'booking.refund',
  subject:         { type: 'booking', id },
  reason_code:     'HOST_CANCELLED',
  note:            'Host had a plumbing failure',
  payload:         { amount_cents: 4200_00 },
  idempotency_key: 'a8f3…',     // replay-safe: a double-click never double-refunds
  dry_run:         false,        // true → returns blast radius, writes nothing
})
```

In **one transaction** it: checks permission → checks four-eyes → applies the state change → writes `audit_log` (hash-chained) → writes `events` → schedules the undo window. If any step fails, none of it happened. Rate-limited per role. This single function is the most important thing in the console, and it is roughly 200 lines.

---

## 6. Finance & Expenditure — the page you asked for

Per **D2**: **revenue derives from real bookings; costs are entered.** That is the correct trade — it makes the P&L honest without a month of building connectors that break.

### 6.1 The chart of accounts (the shape of the money)

The most important distinction, and the one most marketplace dashboards get wrong:

> **GMV is not revenue. The host's share is not yours. Escrow is a liability, not a balance.**

```
GMV                                    ₹ 10,00,000    ← what guests paid
  less  host payouts                   (₹  8,50,000)  ← PASS-THROUGH. never revenue.
────────────────────────────────────────────────────
= NET REVENUE                          ₹  1,50,000    ← guest fee + host fee (~15% blended, docs/06 §3)

  less  payment processing (~3% GMV)   (₹    30,000)
  less  FX & payout rails              (₹     6,000)
  less  refunds & goodwill credits     (₹    12,000)
  less  Stay-Guarantee claims          (₹     9,000)  ← the brand promise has a claims cost
  less  concierge (agents + AI tokens) (₹    22,000)
────────────────────────────────────────────────────
= CONTRIBUTION MARGIN                  ₹    71,000    (47% of net revenue)

  less  salaries & contractors         (₹    ……)
  less  marketing (by channel)         (₹    ……)
  less  infrastructure & tooling       (₹    ……)
  less  legal, compliance & other      (₹    ……)
────────────────────────────────────────────────────
= OPERATING PROFIT (EBITDA)            ₹    ……
```

Contribution margin is the line that says whether the business works. Everything below it is a choice; everything above it is physics.

### 6.2 Revenue — derived, automatic

Computed from `bookings` + `ledger_entries`. Two rules that must be stated or the number drifts:

- **Recognition point: check-in, not booking.** A booking made in March for a June stay is *deferred revenue* in March. A cancelled booking never earned anything. Booking a €5,000 stay does not make you €750 richer that day.
- **Escrow float is a liability.** Money collected from guests and not yet paid to hosts is *held*, not *held by us*. It appears on the finance page as a distinct line and is never summed into any revenue figure.

### 6.3 Expenditure — entered, structured

The table that makes the P&L real:

```sql
create table public.expenses (
  id             uuid primary key default gen_random_uuid(),
  incurred_on    date not null,
  category       text not null references expense_categories(key),
  subcategory    text,
  vendor         text,
  description    text,
  amount_cents   bigint not null check (amount_cents > 0),
  currency       text not null default 'INR',
  fx_rate        numeric,                   -- to reporting currency, at incurred_on
  market         text,                      -- 'IN' | 'global' | … (for per-market P&L)
  campaign       text,                      -- joins marketing spend → CAC
  is_variable    boolean not null default false,  -- scales with GMV?
  receipt_url    text,
  entered_by     uuid not null references profiles(id),
  approved_by    uuid references profiles(id),
  recurring_id   uuid references recurring_expenses(id),
  created_at     timestamptz not null default now()
);
```

**Cost centres** (`expense_categories`), split by behaviour, because that split is what produces contribution margin:

| Variable (scales with bookings) | Fixed (opex) |
|---|---|
| Payment processing | Salaries & contractors |
| FX / payout rails | Marketing (by channel + campaign) |
| Refunds & goodwill credits | Infrastructure (Supabase, Vercel, maps, SMS, email) |
| Stay-Guarantee claims | Tooling & subscriptions |
| Concierge — human agents | Legal & compliance |
| Concierge — AI tokens | Office & misc |

**Recurring expenses are the feature that makes this usable.** Nobody re-enters salaries every month. Enter once; a monthly job materializes the rows.

```sql
create table public.recurring_expenses (
  id            uuid primary key default gen_random_uuid(),
  category      text not null references expense_categories(key),
  vendor        text,
  description   text,
  amount_cents  bigint not null,
  currency      text not null default 'INR',
  cadence       text not null default 'monthly',   -- 'monthly' | 'quarterly' | 'annual'
  starts_on     date not null,
  ends_on       date,
  active        boolean not null default true
);
```

**Budgets turn a ledger into a management tool.** Without budget-vs-actual variance, the expenditure page is just a receipt drawer.

```sql
create table public.budgets (
  period       date not null,         -- month, first-of-month
  category     text not null references expense_categories(key),
  amount_cents bigint not null,
  primary key (period, category)
);
```

### 6.4 The unit economics view

The screen that answers *does this business work*, computed per booking and per cohort:

| Metric | Definition |
|---|---|
| Net revenue per booking (ARPB) | net revenue ÷ confirmed bookings |
| Variable cost per booking | (processing + FX + refunds + guarantee + concierge) ÷ bookings |
| **Contribution margin per booking** | ARPB − variable cost per booking |
| **CAC by channel** | marketing spend (campaign) ÷ new users attributed to it |
| Payback period | CAC ÷ contribution margin per new user per month |
| **LTV : CAC** | the number an investor asks for; < 3:1 means the model doesn't work yet |

**Attribution makes CAC real rather than guessed.** Capture `utm_source` / `utm_campaign` / referral code at signup, store it on the profile, and join marketing `expenses.campaign` → users → bookings. Without that join, "CAC" is a number you made up.

### 6.5 The ledger underneath

Double-entry, `ledger_accounts` + `ledger_entries` (`journal_id`, `account`, `debit`, `credit`, sum-to-zero constraint per journal). Every money event — capture, refund, partial refund, payout, chargeback, adjustment, guarantee claim — writes balanced entries.

**Build this before real payments go live.** A `bookings.total_cents` column is not accounting; the moment partial refunds and host cancellations exist it silently drifts, and retrofitting double-entry onto a live payments system is one of the genuinely miserable jobs in software.

---

## 7. Analytics

### Three layers, three tools — do not merge them

| Layer | Question | Latency | Tool | Lives |
|---|---|---|---|---|
| **Operational** | "How many incidents are breaching SLA *right now*?" | seconds | Postgres materialized views | inside `/admin` |
| **Product** | "Where does the booking funnel leak?" | minutes | **PostHog** (funnels, retention, replay) | embedded |
| **Business** | "Contribution margin by market this quarter?" | hours | **Metabase** over a read replica | embedded |

Analytics queries never touch the tables serving the booking path. That is what the read replica is for.

### The semantic layer — one definition per metric

A **metric catalogue** (`docs/metrics.md` + dbt-style SQL models) where every metric declares: *name · definition in words · SQL · source events · owner · refresh cadence*. The console and the BI tool both read from it.

> If "active host" means one thing on the dashboard and another in the board deck, you do not have analytics. You have two opinions.

### The metrics that actually matter

**Liquidity — the most-missed set.** Search→book conversion. **Zero-result search rate** — searches that returned nothing are the cheapest, clearest supply-gap signal you will ever get, and almost nobody instruments them. Supply/demand balance per market. Days-to-first-booking for a new listing (your leading indicator of host churn). And listing-utilization *distribution*, not average — if 10% of listings take 80% of bookings you have concentration risk, not a healthy market, and the average hides it.

**Funnel**, with drop-off at every step: `search.performed` → non-empty results → `listing.viewed` → `booking.started` → `payment.captured` → `booking.confirmed`.

**Quality — where the brand promise is measured.** Cancellation rate **split by who cancelled** (host-initiated is a supply-quality problem; guest-initiated is a pricing/expectation problem — averaging them tells you nothing). Incidents per 1,000 nights. First-response and resolution time by tier. Refund rate. Rebooking rate after a host cancels.

**Trust.** Chargeback rate — **stay under 0.65% or the card networks intervene**, which is an existential threshold, not a KPI. Fraud attempt rate. KYC pass rate. Account-takeover signals.

**Finance.** GMV, net revenue, take rate, contribution margin, CAC by channel, LTV:CAC, escrow float, refund liability.

**Retention.** Repeat booking rate. Guest LTV by acquisition cohort. Host survival at 6 months.

**Operations.** Tickets per booking. Agent handle time. **AI deflection rate** — the share of concierge conversations resolved with no human. That single number decides whether "24/7 multilingual concierge" is a moat or a cost centre.

### North star

Not GMV. **Nights stayed with zero incidents.**

It rises only when you grow *and* hold quality, so it cannot be gamed by growth that degrades hospitality — which is precisely the failure mode the whole *omotenashi* thesis exists to avoid. GMV is the number a competitor optimizes; this is the number Ryo optimizes.

### Alerting

Thresholds on the metrics above route to the health surface + Slack. Anomaly detection on **staff** behaviour too (bulk refunds at 3am, an unusual PII-unmask rate) — insider risk is a real category, and the audit log is only useful if something reads it.

---

## 8. Data model — every new table

| Table | Purpose | Phase |
|---|---|---|
| `events` (partitioned) | the analytics spine | 0 |
| `audit_log` (hash-chained) | governance / evidence | 0 |
| `reason_codes` | canonical reasons; drives KPIs | 0 |
| `approvals` | four-eyes requests | 0 |
| `role_permissions` | the matrix, as data | 1 |
| `staff_sessions`, `elevations` | SSO, break-glass | 1 |
| `admin_views` | saved segments | 1 |
| `exports` | export jobs + their audit | 1 |
| `incidents`, `incident_events` | replaces `incident-store.ts` | 2 |
| `listing_calendar` | replaces `host-calendar-store.ts` | 2 |
| `feature_flags`, `experiments` | replaces the flag override store | 2 |
| `host_actions` | replaces `host-actions-store.ts` | 2 |
| `ledger_accounts`, `ledger_entries` | double-entry | 3 |
| `expenses`, `expense_categories`, `recurring_expenses`, `budgets` | **the expenditure model** | 3 |
| `payouts`, `payout_batches` | payout runs + exceptions | 3 |
| `risk_signals`, `account_links` | T&S graph | 6 |

---

## 9. Tech choices — opinionated

| Concern | Choice | Why |
|---|---|---|
| Omnibox + facets | **Typesense** (self-hosted) | Sub-50ms faceted search. Start on Postgres FTS + `pg_trgm`; the query interface is designed so the swap is one adapter. |
| Product analytics | **PostHog** | Funnels, retention, replay, flags, experiments in one. Self-hostable, so PII stays yours. |
| BI | **Metabase** over a read replica | Embed it. Do not build charts by hand in the console. |
| Errors | **Sentry** | — |
| Jobs / queues | `pg_cron` + a worker; **dead-letter queue visible in the console** | A job that fails silently is worse than one that doesn't run. |
| Rate limiting | **Upstash Redis** | — |
| Staff auth | Supabase SSO (Google Workspace) + TOTP/passkey; RLS server-side | The client hides buttons; the database refuses writes. |

---

## 10. Build order

Each phase is independently shippable and unblocks the next. **Phase 0 has no visible output and is the most important.**

| Phase | What | Unblocks |
|---|---|---|
| **0 · Spine** | `events` · `audit_log` (hash-chained) · `reason_codes` · `approvals` · the `adminAction()` write path with dry-run + idempotency | Literally everything. Hardest to backfill later. |
| **1 · The table primitive** | `<AdminTable>` + `useAdminList` + keyset pagination + facets + saved views + ⌘K. Rebuild **Users** on it, then reuse across every list. | Kills the "database browser" problem permanently. |
| **2 · Real persistence** | The 5 missing tables → delete `admin-store` · `incident-store` · `host-calendar-store` · `host-actions-store` · `host-verification-store` | Admin actions stop being localStorage theatre. |
| **3 · Finance** | Ledger → expenses + recurring + budgets → P&L + unit economics page | Answers "does this business work". |
| **4 · Access** | `role_permissions` + RLS + PII masking + four-eyes + SSO/2FA | Safe to hire an employee. |
| **5 · Analytics** | PostHog taxonomy · Metabase · metric catalogue · alerting | Answers "is the marketplace healthy". |
| **6 · Concierge desk** | Inbox + in-conversation actions + SLA board + AI drafts | The actual product differentiator. |
| **7 · Trust & Safety** | Risk scoring · account-link graph · rules engine · SOS | Safe to scale. |

---

## 11. Definition of done — the anti-vibe checklist

The console is "professional" when every one of these is true. Until then it isn't, regardless of how it looks.

- [ ] No client-side filtering, sorting, or pagination exists anywhere in the console.
- [ ] Every list is keyset-paginated, virtualized, and defaults to a **named segment** — never "all rows".
- [ ] ⌘K resolves any identifier to its inspector in under 100ms.
- [ ] Every mutation goes through `adminAction()`: reason code, dry-run blast radius, idempotency key, audit row, event row — in one transaction.
- [ ] The audit log is hash-chained, and a nightly job verifies the chain.
- [ ] No permission check lives only in the client. Turning off JavaScript grants nothing.
- [ ] PII is masked by default; every unmask is audited.
- [ ] Bulk actions are capped, preview their blast radius, and need a second approver above threshold.
- [ ] Every export is a job that writes an audit row.
- [ ] **No number on any screen is computed in React.** Every metric has exactly one definition, in SQL, in the catalogue.
- [ ] GMV is never called revenue. Escrow float is never summed into a revenue line.
- [ ] Contribution margin per booking is visible on one screen, from real bookings and entered costs.
- [ ] Zero-result searches are instrumented and reviewable.
- [ ] Admin routes fail **closed** — an unauthenticated request gets nothing, not an empty shell.
- [ ] The demo-role bypass (`demo-auth.ts`) is gone from production builds.

---

## 12. Open questions

- **Reporting currency.** INR base with FX at transaction date, or USD base? Affects the ledger and every finance screen. (Recommendation: INR base, since India is the launch market and the payout rails are UPI/IMPS; store both.)
- **Revenue recognition on no-shows and partial stays** — earned or refunded?
- **Guarantee-claims reserve** — accrue a % of GMV as a provision, or expense claims as they land? (Recommendation: accrue; it smooths the P&L and forces honesty about the promise's cost.)
- **Auto-approve threshold for listings** that pass every automated check — full human review does not scale past a few thousand listings.
- **Console build vs buy** — §14 asked this. Recommendation: **build**, because the ⌘K + segment + audited-action pattern *is* the product's operational advantage, and Retool cannot express it.
- **Outsourced moderation** at scale — changes the PII-masking bar from "good practice" to "load-bearing".
