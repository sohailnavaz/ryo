# 07 · Messaging

> Guest ↔ host communication, with auto-translate and a concierge co-pilot.

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Module ID     | `07-messaging`                                                                           |
| Status        | ✏️ Draft                                                                                 |
| v1 scope      | Read-only (no send). Full module is **v2**.                                              |
| Owner         | TBD                                                                                      |
| Linked        | [05 bookings](./05-bookings.md), [10 i18n](./10-i18n-localization.md), [11 trust-safety](./11-trust-safety.md), [12 concierge](./12-concierge-support.md) |
| Last updated  | 2026-04-24                                                                               |

---

## 1. Purpose & Ryo alignment

Messaging is how hospitality becomes felt — pre-arrival coordination, arrival logistics, mid-stay care. It must be **fast, translated, moderated**, and a place where concierge can silently or visibly step in. Calm tone applies; the brand voice rules in [branding §6](./branding.md#6-voice--tone) govern system-generated messages.

---

## 2. User stories

### Guest
- As a guest, I want to message the host in my language and have them read it in theirs.
- As a guest, I want check-in instructions in-thread, not scattered across emails.
- As a guest, I want to escalate to Ryo concierge from inside the thread if the host is unresponsive.

### Host
- As a host, I want pinned templates for common messages (check-in, Wi-Fi, nearest market).
- As a host, I want to be notified on mobile when a guest messages me.

### Concierge
- As a concierge, I want to see any thread, assist the guest, or take over if the host is absent — with the host's knowledge.

---

## 3. Thread types

| Type                | Participants                          | Opens when                        |
| ------------------- | ------------------------------------- | --------------------------------- |
| **Pre-inquiry**     | Guest + host                          | Guest asks a question before booking (limited to 2 messages before booking request) |
| **Booking thread**  | Guest + host (+ concierge if engaged) | Booking reaches `requested` or `confirmed` |
| **Concierge thread**| Guest + concierge                     | Guest opens a support ticket       |
| **Internal note**   | Concierge / moderators only           | Attached to any of the above       |

---

## 4. Core flows

### 4.1 Send message
1. Author composes; client detects language; translation requested server-side.
2. Server persists original + translations for each participant's preferred locale.
3. Fan-out via realtime channel + push + email (if recipient offline > 5 min).

### 4.2 Auto-translate
- Server stores the **original** + generates translations per participant's `preferred_locale` on send.
- Shown as "Translated from Hindi — see original".
- Critical surfaces (arrival instructions, address, gate codes) show the **original alongside** translation, always.
- Provider: Google Translate / DeepL (TBD — DeepL preferred for EU languages, Google for coverage).

### 4.3 Attachments
- Photos (for damage reports, menu, directions).
- Documents (PDF rental agreement, parking permit).
- Size limit 10MB per file, virus-scanned.

### 4.4 Concierge takeover
- Concierge can **join** a thread (visible) or leave an **internal note** (invisible to guest/host).
- If host is unresponsive for > SLA, concierge auto-engages and the guest sees a new "Ryo concierge" identity in the thread.

### 4.5 Read receipts & typing
- Read receipts on by default; user can disable in settings.
- Typing indicators ephemeral (not persisted).

### 4.6 Moderation
- Auto-scan for: prohibited content (off-platform payment attempts, contact-info swap, abusive language).
- Flagged messages held for concierge review before delivery (user sees "pending review").
- Users can report a message → moderator queue.

---

## 5. Data model

### `public.threads`
| `id`, `type`, `booking_id (nullable)`, `listing_id (nullable)`, `created_at`, `last_message_at`, `state` (open/closed/archived) |

### `public.thread_participants`
| `thread_id`, `user_id`, `role` (guest/host/concierge/moderator), `last_read_at`, `muted` |

### `public.messages`
| Column              | Type          | Notes                                          |
| ------------------- | ------------- | ---------------------------------------------- |
| `id`                | `uuid`        |                                                |
| `thread_id`         | `uuid FK`     |                                                |
| `author_id`         | `uuid FK`     |                                                |
| `author_role`       | `text`        | snapshot of role                               |
| `body`              | `text`        | original                                       |
| `body_lang`         | `text`        | detected                                       |
| `attachments`       | `jsonb`       | array of `{key, type, size}`                   |
| `visibility`        | `text`        | `public` / `internal_note`                     |
| `moderation_state`  | `text`        | `pending` / `allowed` / `blocked`              |
| `created_at`        | `timestamptz` |                                                |

### `public.message_translations`
`(message_id, locale) → translated_body` — cached on first read per locale.

### `public.thread_templates`
Host-side saved replies, personalised with variables (`{{guest_name}}`).

---

## 6. API surface

- `POST /threads/:id/messages` — send.
- `GET /threads/:id/messages?cursor=` — paginated.
- `POST /threads/:id/participants/concierge-join`.
- `POST /messages/:id/report`.
- `PATCH /threads/:id/read` — mark read up to a message.
- Realtime channel: Supabase Realtime on `messages` table filtered by `thread_id`.

---

## 7. Edge cases & failure modes

- **Translation failure.** Fall back to original with a "translation unavailable" notice — never silently drop.
- **Off-platform contact attempts.** Detect and warn sender; block if persistent (tied to T&S).
- **Guest-host language mismatch at check-in.** Promote critical fields (address, codes) to be shown untranslated beside translation.
- **Concierge joins a thread mid-conflict.** Thread history is preserved in full; concierge identity is distinct.
- **Large attachment from slow mobile.** Resumable upload; fall back to single-shot with retry.
- **Guest reports host harassment.** Immediate concierge engagement; freeze booking if warranted.
- **Moderation false positive.** Hold messages no longer than 15 minutes; escalate if unresolved.
- **Thread across time zones — push at 3am.** Respect quiet-hours unless booking-critical ([§09](./09-notifications-mail.md)).

---

## 8. KPIs

- **Time to first host response** (P50, P95) — also surfaced on listings.
- **Translation coverage** (share of messages delivered translated).
- **Concierge engagement rate** (target low — high means hosts are failing).
- **Flagged-message false-positive rate**.
- **Message delivery latency** (send → recipient push).

---

## 9. Dependencies

- [05 bookings](./05-bookings.md) — threads created on booking events.
- [09 notifications-mail](./09-notifications-mail.md) — email/push fan-out.
- [10 i18n-localization](./10-i18n-localization.md) — translation routing.
- [11 trust-safety](./11-trust-safety.md) — moderation rules.
- [12 concierge-support](./12-concierge-support.md) — concierge desk tooling.
- **Translation**: Google Translate / DeepL.
- **Realtime**: Supabase Realtime.

---

## 10. v1 scope

- ✅ Read-only viewer for system-generated messages on bookings (confirmations, reminders rendered as in-app messages).
- 🔲 User-to-user send — **v2**.
- 🔲 Auto-translate — **v2**.
- 🔲 Concierge takeover — **v2**.

---

## 11. Open questions

- 🔲 Translation vendor pick — DeepL for quality, Google for coverage.
- 🔲 Do we show "original" by default or translated by default? Default: **translated**, with quiet toggle.
- 🔲 Voice notes — v3 or never?
- 🔲 End-to-end encryption — brand-on (calm/trust) but blocks moderation; partial approach (content at rest encrypted, metadata not).
- 🔲 Retention — how long are messages kept after check-out (for disputes)? Default: 24 months.
