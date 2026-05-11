# 12 · Concierge & Support

> 24/7 multilingual human support. The Ryo differentiator, operationalised.

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Module ID     | `12-concierge-support`                                                                   |
| Status        | ✏️ Draft                                                                                 |
| v1 scope      | Stub — email-only support at launch, escalation via shared inbox. Full desk in v2.       |
| Owner         | TBD (Head of Hospitality / Concierge Ops, to be hired before v2)                         |
| Linked        | Every module — concierge touches all surfaces                                            |
| Last updated  | 2026-04-24                                                                               |

---

## 1. Purpose & Ryo alignment

**This is the module that defines Ryo.** Every other platform has support. We have *concierge* — humans who anticipate, advocate, and own outcomes. When a guest tells a friend "Ryo is better than Airbnb," it is almost always because of a concierge interaction.

The Japanese hospitality principle in our brand — *omotenashi* — is not a metaphor here. It is a staffing plan, a training syllabus, a tooling brief, and a set of SLAs.

---

## 2. Service promise 🔒

> Ryo concierge answers in under 2 minutes on chat, under 30 seconds on phone, in the guest's preferred language, 24/7, every day of the year. If something goes wrong with a stay, a human — not a form — owns the outcome until it is fixed.

Every line in this promise is measurable (§14 KPIs) and contractual (§6 SLAs).

---

## 3. User stories

### Guest
- As a guest, I want to reach a human in my language within seconds, at any hour.
- As a guest, I want concierge to have full context on my booking without me repeating it.
- As a guest, I want one point of contact through an issue — not handoffs.
- As a guest, I want Ryo to fix things, not explain why they can't be fixed.

### Host
- As a host, I want concierge to reach me respectfully when a guest has an issue, not catastrophically.
- As a host, I want concierge to back me against unreasonable guest claims with evidence.

### Concierge
- As a concierge, I want one console with thread + booking + payment + history + internal notes.
- As a concierge, I want authority to resolve — credits, waivers, re-books — within a capped budget.
- As a concierge, I want clear escalation paths up and across.
- As a concierge, I want to work in my native language while speaking to guests in theirs.

---

## 4. Channels

| Channel       | SLA first response             | Used for                                         |
| ------------- | ------------------------------ | ------------------------------------------------ |
| **In-app chat** | **< 2 min** P50, < 5 min P95 | Primary for logged-in users; full context        |
| **Email**       | **< 30 min**                | Longer / documentation-heavy cases               |
| **Phone**       | **< 30 sec** pickup         | Arrival/in-stay; international toll-free         |
| **WhatsApp / iMessage** | **< 5 min**         | Guest's preferred messaging network              |
| **SOS (in-stay)** | **< 2 min** to a human    | P0 incidents ([§11](./11-trust-safety.md))       |

Every channel lands in the same unified inbox.

---

## 5. Staffing & follow-the-sun

### Regions
- **India / SEA** — Asia-Pacific daytime.
- **EU / MEA** — Europe daytime.
- **Americas** — US/LatAm daytime.

Shifts overlap so every tier-0/1 region has senior cover at all times.

### Languages (v2 launch)
English, Hindi, Spanish, French, Arabic, Japanese — matching the launch locales in [§10](./10-i18n-localization.md). Additional languages added as supply / demand warrant.

### Specialisations
- **Arrival / in-stay desk** (P0/P1, fast resolution authority).
- **Disputes desk** (P1/P2, evidence-driven).
- **Host desk** (host-facing care and coaching).
- **General desk** (P2/P3, pre-booking and general).

### Quality
- Weekly call/chat reviews, rubric-scored.
- Guest-feedback signal on every resolved ticket.
- Mentor system for new agents; minimum 30-day shadowing before live.

---

## 6. Authority ladders 🔒

Each tier has a credit / waiver / decision budget. Above the cap, escalate.

| Level          | Authority                                                                           |
| -------------- | ----------------------------------------------------------------------------------- |
| **Agent**      | Credits up to small cap; full-refund eligibility within policy; re-book assist      |
| **Senior agent** | 3× agent cap; policy-exception waivers; guest / host suspensions (subject to T&S) |
| **Shift lead** | Full platform refunds; host-tier changes; incident re-tiering                       |
| **Head of Hospitality** | Contract-level decisions; media / escalations; insurance authorisation      |
| **T&S handoff**| Any P0/P1 safety or fraud path → [§11](./11-trust-safety.md)                        |

Every credit or waiver is logged with a **reason code** that feeds the company KPIs.

---

## 7. Core workflows

### 7.1 New ticket
1. Ticket opened (chat widget, SOS, email, phone call, host report).
2. Auto-contextualised: booking, payments, past tickets, language preference, VIP/boutique flag.
3. Routed by: specialisation + language + workload → assigned agent.
4. Agent greets within SLA.

### 7.2 Arrival issue (classic P1)
1. Guest messages on arrival: "this isn't the property in the photos."
2. Agent validates via photos (guest upload) + listing history + host contact.
3. Options: escalate to host for immediate fix; re-book protection ([§11](./11-trust-safety.md) Guest Arrival Protection); refund + re-book elsewhere.
4. Agent stays on thread until guest is settled.
5. Post-stay: damage / misrep case documented; host follow-up.

### 7.3 Re-book protection
- When Ryo has caused or accepted cost for a stay failure, re-book assistance is active:
  - Comparable listing, same dates/area/party size.
  - Difference absorbed by Ryo up to a published cap.
  - Concierge-managed booking (no self-serve friction in the moment).

### 7.4 Proactive care (*omotenashi* operationalised)
- First-time guests: welcome nudge 48h before arrival.
- Birthdays / anniversaries (opt-in): small gesture via host.
- Weather / flight-delay awareness: proactive message with flexible check-in offer.
- Tier-up surprises (e.g. first-Boutique booking).

### 7.5 Host coaching
- Hosts with rating drops, slow responses, or repeated cancellations get outreach — supportive first, corrective if needed.

---

## 8. Tooling — Concierge Console ✏️

A purpose-built internal web app. Non-negotiable features:

- **Unified inbox**: chat + email + phone transcripts + in-app messages, one thread per user.
- **Context panel**: booking details, payments, incidents, prior tickets — always visible.
- **Composer**: templates, translation helpers, tone guide, character counts.
- **Authorised actions**: refunds, credits, re-books, listing flags, escalations — within role cap.
- **Internal notes**: visible to staff only.
- **Knowledge base**: searchable playbooks per scenario.
- **Language helper**: agent writes in their native language; system offers brand-tone translation to guest locale, agent approves.
- **Quiet queue controls**: snooze, assign, tag, bulk-action.
- **Metrics sidebar**: agent's own SLA performance live.

Console lives under [§14 admin-ops](./14-admin-ops.md) but is described in detail here because its users *are* this module.

---

## 9. Data model

Most data reuses other modules (threads, bookings, incidents). Concierge-specific:

### `public.tickets`
| Column          | Type          | Notes                                             |
| --------------- | ------------- | ------------------------------------------------- |
| `id`            | `uuid`        |                                                   |
| `subject_user`  | `uuid FK`     | guest or host                                     |
| `channel`       | `text`        | chat / email / phone / whatsapp / sos             |
| `topic`         | `text`        | classification                                    |
| `state`         | `text`        | `open` / `waiting` / `resolved` / `closed`        |
| `priority`      | `text`        | P0/P1/P2/P3                                       |
| `assigned_to`   | `uuid`        | agent                                             |
| `thread_id`     | `uuid FK`     | where the conversation lives                      |
| `booking_id`    | `uuid FK`     | if applicable                                     |
| `incident_id`   | `uuid FK`     | if linked                                         |
| `opened_at`     | `timestamptz` |                                                   |
| `first_response_at` | `timestamptz` |                                               |
| `resolved_at`   | `timestamptz` |                                                   |
| `resolution_code`| `text`       | reason code                                       |
| `satisfaction_score` | `int`    | post-resolution survey                            |

### `public.agent_skills`
Agent ↔ language ↔ specialisation mapping, drives routing.

### `public.resolution_actions`
Every action taken by an agent on a ticket — credits, refunds, waivers, escalations — with amount and reason. Feeds audit + KPIs.

### `public.playbooks`
Versioned knowledge articles indexed by scenario.

---

## 10. Phone infrastructure

- Toll-free numbers in each major market.
- IVR minimal (just language + booking-in-progress vs general).
- Call recording with consent; transcripts attached to ticket.
- Provider TBD (Twilio Voice + Dialpad or internal via Genesys at scale).

---

## 11. Edge cases & failure modes

- **Spike during a local disaster.** Proactive blanket policy activated (re-book / full refund); surge agents pulled in; messaging templated.
- **Language with no native agent online.** Live interpreter service as emergency fallback; T+24 hire priority.
- **Guest rage escalation.** De-escalation training, hand-off to senior, and — if abusive — firm-but-polite boundary + ticket closure.
- **Host abuse of concierge channel.** Rate-limited; host-care specialist takes over; patterns → T&S.
- **Agent burnout.** Max-2h continuous queue time; scheduled breaks; welfare rotation.
- **After-resolution unhappiness.** 24-hour follow-up check on any P1+ resolution; satisfaction < threshold reopens.

---

## 12. Knowledge & training

- Playbooks versioned; updated after every novel case.
- New-agent onboarding: 3 weeks (brand voice, product, systems, shadow).
- Weekly brand-voice refresh (one real example, one rewrite).
- Quarterly cross-region sit-ins to share patterns.

---

## 13. KPIs 🔒

- **First response time** P50 / P95 by channel (must beat SLA).
- **Resolution time** P50 / P95 by priority.
- **Customer satisfaction** (CSAT) post-resolution.
- **Re-open rate**.
- **SLA compliance rate**.
- **Credit / refund spend** per 1000 bookings (watch for trend).
- **Agent utilisation** (not a target to maximise — a health check).
- **"Moments of delight"** — proactive care touches logged per week.

---

## 14. Dependencies

- Every other module.
- **Telephony**: Twilio Voice (v2) or equivalent.
- **Helpdesk / console**: custom build on Next.js admin, or thin layer over a CRM (TBD — Intercom/Front evaluation).
- **Knowledge base**: internal (Notion for MVP, migrate later).
- [09 notifications-mail](./09-notifications-mail.md) — outbound.
- [11 trust-safety](./11-trust-safety.md) — escalations.

---

## 15. v1 scope

- ✅ `support@ryostays.com` inbox monitored.
- ✅ One founder / small team handles all tickets (no dedicated concierge yet).
- ✅ Templates for common scenarios (booking confirmed, refund issued, magic-link resend).
- 🔲 Concierge console — **v2**.
- 🔲 24/7 multilingual coverage — **v2**.
- 🔲 SOS path — **v2**.
- 🔲 Phone / WhatsApp channels — **v2/v3**.

---

## 16. Open questions

- 🔲 Build vs. buy concierge console (Front / Intercom / custom).
- 🔲 Tier-0 language coverage plan (which languages, by when).
- 🔲 How do we publish SLA commitments publicly — as marketing or cautiously?
- 🔲 Agent compensation model — incentivise quality, not volume; exact rubric TBD.
- 🔲 Concierge as a **paid upgrade** tier (luxury hosting) — v3 exploration.
- 🔲 AI assistance — where it accelerates agents without replacing voice (translation, context summary, suggested replies).
