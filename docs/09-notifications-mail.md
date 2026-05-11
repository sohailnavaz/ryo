# 09 · Notifications & Worldwide Mail

> How Ryo reaches a user — in the right channel, in the right language, at the right time, reliably, anywhere in the world.

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Module ID     | `09-notifications-mail`                                                                  |
| Status        | ✏️ Draft                                                                                 |
| v1 scope      | Transactional email (confirmations, receipts) + basic in-app. Push & SMS in v2.          |
| Owner         | TBD                                                                                      |
| Linked        | [10 i18n](./10-i18n-localization.md), [02 auth](./02-auth-identity.md), [05 bookings](./05-bookings.md), [07 messaging](./07-messaging.md) |
| Last updated  | 2026-04-24                                                                               |

---

## 1. Purpose & Ryo alignment

Communication is a direct expression of the brand. A booking confirmation that arrives instantly, in the guest's language, with all the useful facts up front, is *literally* what "better service than Airbnb" looks like. This module is also how we hold the "worldwide quick load" and "all-language change" promises the founder made early on.

---

## 2. User stories

### Guest
- As a guest, I want booking confirmations in my preferred language — no matter where the host lives.
- As a guest, I want check-in instructions 24h before arrival, in my language.
- As a guest, I want to be notified on the channel I chose (email by default, push once I install the app).
- As a guest, I want to opt in / out of marketing without affecting transactional notifications.

### Host
- As a host, I want booking and payout notifications instantly.

### Ops
- As ops, I want deliverability dashboards: sends, opens, bounces, complaints, suppressions.
- As T&S, I want an auditable trail of every outbound communication on a booking.

---

## 3. Channels

| Channel     | Use                                                              | Fallback                             |
| ----------- | ---------------------------------------------------------------- | ------------------------------------ |
| **Email**   | All transactional, optional marketing                            | —                                    |
| **Push**    | Real-time alerts (mobile app present)                            | Email if push fails / no device      |
| **SMS**     | Arrival-day critical only (OTP, check-in), opt-in only           | Email if SMS fails                   |
| **In-app**  | Inbox + system messages                                          | Always available                     |
| **Voice**   | Concierge outbound in emergencies only                           | —                                    |

---

## 4. Event taxonomy 🔒

Every notification is driven by a canonical **event**. Events are not coupled to channels; a single event fans out to whichever channels the user has opted into.

Examples:
| Event                     | Default channels                        | Critical?     |
| ------------------------- | --------------------------------------- | ------------- |
| `auth.magic_link`         | email                                   | yes           |
| `auth.phone_otp`          | sms                                     | yes           |
| `booking.confirmed`       | email + push + in-app                   | yes           |
| `booking.arrival_t_minus_24h` | email + push + sms (opt-in)         | yes           |
| `booking.arrival_t_minus_2h`  | push + in-app                       | yes           |
| `booking.check_out_reminder`  | push                                | no            |
| `booking.cancelled`       | email + push + in-app                   | yes           |
| `payment.refund_issued`   | email + in-app                          | yes           |
| `messaging.new_message`   | push + email (if offline >5m)           | no            |
| `review.prompt`           | email + push                            | no            |
| `marketing.*`             | email + in-app (opt-in only)            | no            |

**Critical events always send**, regardless of marketing opt-out. Quiet-hours are honoured for non-critical only.

---

## 5. Worldwide email infrastructure ✏️

### Sending domains
- Marketing & transactional from `ryostays.com` (primary brand domain).
- Subdomains: `mail.ryostays.com` (transactional), `news.ryostays.com` (marketing), `updates.ryostays.com` (system) — for domain-reputation isolation.
- Replies routed to `support@ryostays.com` → concierge desk ([§12](./12-concierge-support.md)).

### Authentication
- **SPF**, **DKIM**, **DMARC** on every sending domain — DMARC policy `p=reject` once deliverability validated.
- **BIMI** (for brand logo in inbox) once a registered trademark exists.
- TLS-only, MTA-STS record.

### Providers
- **Primary**: Resend (preferred) or AWS SES.
- **Secondary**: failover provider, same domain, different routing — critical outage protection.

### Regionality
- Send from **region closest to the recipient** to reduce latency and comply with data residency (EU mail routed via EU sender, India mail via Asia sender).

### Deliverability guardrails
- Warm sending domains per market over 2–4 weeks before high volume.
- Suppression lists (bounces, complaints, unsubscribes) respected across all domains.
- Engagement-based send throttling — drop cold segments before they hurt reputation.

---

## 6. Template system

- Templates live in `packages/ui/emails/` as **React Email** components.
- Every template has:
  - `base` layout (brand header, footer, legal, unsubscribe link)
  - `body` per event
  - `plain_text` fallback (mandatory — never HTML-only)
- Templates are **locale-aware**: the same template renders in the recipient's `preferred_locale` (see [§10](./10-i18n-localization.md)).
- Variables come from the event payload; rendering is server-side via a worker.

### Anatomy 🔒
Every transactional email follows this structure:
1. **Subject** — lead with the useful fact. Never clickbait. Never all-caps.
2. **Preheader** — inbox preview; repeats key fact.
3. **Body — opening line**: what this email is.
4. **Body — key facts** (booking dates, address, amount, next step).
5. **Primary CTA** — one.
6. **Secondary content** — map link, host message, Ryo guarantees.
7. **Footer** — legal, unsub (if marketing), physical address, locale switcher.

### Example subject lines (voice-correct)
- ✅ *"Your Ryo stay in Goa is confirmed — Fri Apr 26 → Mon Apr 29."*
- ❌ *"🎉 You're all set! Get ready for your trip!"*

---

## 7. Push

- **Expo Push** routed to APNs (iOS) and FCM (Android).
- Device tokens registered per user, invalidated on logout.
- Categories match event taxonomy; OS-level notification channels exposed for user control.
- **Silent push** used for: booking status sync, thread read-state.
- Data-only payloads for background refresh.

---

## 8. SMS

- **Twilio** global; **MSG91 / Gupshup** for India (lower cost, local templates).
- Used sparingly — OTP, arrival reminders, emergency concierge.
- TRAI DLT templates registered for India; opt-in flow recorded.
- Cost-aware routing (SMS expensive) — never used for non-critical.

---

## 9. In-app inbox

- Unified inbox under `Activity` tab.
- Every notification is also written to `public.notifications` so users can catch up after being offline.
- Real-time updates via Supabase Realtime.

---

## 10. User preferences

- Per-channel + per-event-class toggles (transactional cannot be disabled).
- Quiet hours (local timezone).
- Language & currency (see [§10](./10-i18n-localization.md)).
- Global unsubscribe link on every marketing email; one-click.

---

## 11. Data model

### `public.notification_events`
Append-only source of truth: `(id, event_type, subject_user_id, payload jsonb, created_at)`.

### `public.notification_deliveries`
Per-channel delivery attempt:
| Column          | Type          | Notes                                |
| --------------- | ------------- | ------------------------------------ |
| `id`            | `uuid`        |                                      |
| `event_id`      | `uuid FK`     |                                      |
| `channel`       | `text`        | `email` / `push` / `sms` / `in_app`  |
| `to_address`    | `text`        | email / phone / device token         |
| `provider`      | `text`        | resend / ses / expo / twilio / …     |
| `provider_ref`  | `text`        |                                      |
| `state`         | `text`        | `queued` / `sent` / `delivered` / `opened` / `bounced` / `complained` / `failed` |
| `locale`        | `text`        |                                      |
| `created_at`    | `timestamptz` |                                      |
| `updated_at`    | `timestamptz` |                                      |

### `public.notification_preferences`
Per-user channel and event-class opt-ins; quiet hours; locale.

### `public.suppression_list`
Global bounces, complaints, unsubscribes; keyed on address.

### `public.device_tokens`
Per-user device registration for push.

---

## 12. API surface

- Internal event emitter `emit(event_type, subject_user_id, payload)` — used by all other modules.
- `GET /notifications` — user inbox.
- `PATCH /notifications/:id/read`.
- `PUT /notification-preferences`.
- `POST /webhooks/{resend|ses|twilio|expo}` — delivery state updates.

---

## 13. Edge cases & failure modes

- **Provider outage.** Secondary provider auto-takes-over for critical events.
- **Hard bounce on a verified user.** Suppress and flag; require re-verification of email.
- **User on airplane for a 10-hour push storm.** De-duplicate and coalesce push on wake.
- **DMARC reject mis-config.** Staging domain distinct from prod; changes gated through ops.
- **Arrival SMS fails in country with no SMS agreement.** Falls back to email + push; ops alerted.
- **Timezone confusion for T−24h.** Compute using **listing's local TZ**, not the user's — arrival is at the property, not the guest's home.
- **Quiet hours vs. booking confirmation at 3am.** Booking confirmation is **critical** — always sends.
- **GDPR / DPDPA data-subject request.** Delete or redact notification history within statutory window.

---

## 14. KPIs

- **Deliverability**: delivered / sent, target ≥99% for transactional.
- **Bounce rate** (<0.5%), **complaint rate** (<0.05%).
- **Open rate** for transactional (benchmark: 60%+).
- **Median delivery latency** per channel.
- **Locale coverage**: % of transactional sends in the user's preferred locale.
- **Fallback rate**: % where secondary provider engaged.

---

## 15. Dependencies

- [02 auth](./02-auth-identity.md) — contact identities (email, phone, device).
- [05 bookings](./05-bookings.md) — booking events source.
- [07 messaging](./07-messaging.md) — message events source.
- [10 i18n-localization](./10-i18n-localization.md) — localisation of every template.
- [12 concierge](./12-concierge-support.md) — inbound replies routing.
- **Providers**: Resend / SES (email), Expo Push (native), Twilio (global SMS), MSG91 (India SMS).

---

## 16. v1 scope

- ✅ Transactional email via Resend (or SES), single sending domain, SPF/DKIM/DMARC configured.
- ✅ Core templates: signup magic-link, booking confirmation, receipt, cancellation.
- ✅ React Email scaffold in `packages/ui/emails/`.
- ✅ In-app notification inbox (basic).
- ✅ Locale routing (rendered in user's `preferred_locale` for the locales we ship v1).
- 🔲 Push — **v2** (requires app-store launch).
- 🔲 SMS — **v2**.
- 🔲 Secondary provider failover — **v2**.
- 🔲 BIMI / trademark-gated branding in inbox — **v2+**.

---

## 17. Open questions

- 🔲 Resend vs. SES as primary — cost at scale vs. ergonomics.
- 🔲 Per-region sending infra — launch with one region, add as we expand, or provision up-front?
- 🔲 Marketing-email cadence policy (weekly max? monthly?).
- 🔲 Should "new message" email be on by default (Airbnb: yes) — trade-off between helpfulness and noise.
- 🔲 Transactional SMS cost ceiling per booking.
