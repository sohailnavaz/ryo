# 14 · Admin & Operations

> The internal console — the control room behind every guest and host experience.

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Module ID     | `14-admin-ops`                                                                           |
| Status        | ✏️ Draft                                                                                 |
| v1 scope      | Not in v1. Ops use Supabase studio + spreadsheets. Full console is **v2**.               |
| Owner         | TBD                                                                                      |
| Linked        | Every module                                                                             |
| Last updated  | 2026-04-24                                                                               |

---

## 1. Purpose & Ryo alignment

If [§12 concierge](./12-concierge-support.md) is the brand differentiator, this is what lets concierge keep that promise. The admin console is the single tool that finance, moderation, T&S, support, and product operations use. Built to be **fast, auditable, and safe** — internal users are trusted *and* audited.

The console embodies our value of **trust earned, not claimed** — internally too. Every privileged action is logged, reviewable, and reversible.

---

## 2. Users

| Role         | Typical use                                                                         |
| ------------ | ----------------------------------------------------------------------------------- |
| `concierge`  | Tickets, threads, credits, re-books (see [§12](./12-concierge-support.md))          |
| `moderator`  | Listing approval queue, review moderation, message reports                          |
| `t&s analyst`| Incident console, fraud queue, bans                                                 |
| `finance`    | Payouts, refunds, daily reconciliation, tax reports                                 |
| `admin`      | User management, feature flags, system config                                       |
| `superadmin` | Role management, audit review, break-glass access                                   |

Every staff role is **least-privilege**; elevation is temporary and logged.

---

## 3. Surfaces

### 3.1 Global search
Search by email, phone, user id, booking id, listing id, incident id, payment id.

### 3.2 User inspector
- Profile (public view + internal notes).
- Bookings (as guest + as host).
- Payments & payouts.
- Tickets + incidents.
- Verification status.
- Device / session history.
- Audit trail of staff actions **on this user**.

### 3.3 Booking inspector
- Full state machine + event log.
- Payment + refund trail.
- Thread.
- Calendar snapshot.
- Actions: cancel (with reason), refund (partial/full), issue credit, escalate, re-book (concierge).

### 3.4 Listing moderation queue
- New submissions + major edits.
- Side-by-side: submitted vs. policy checklist.
- Decision: approve / request changes / reject, with reason codes.
- Bulk actions guarded — never bulk approvals.

### 3.5 Review moderation queue
- Flagged reviews + reporter context.
- Edit / remove / keep, with reason.

### 3.6 Incident console
See [§11](./11-trust-safety.md). Severity-tiered queues.

### 3.7 Finance console
- Daily reconciliation: captures / refunds / payouts / adjustments vs. processor statements.
- Payout queue: scheduled, pending, failed.
- Chargeback inbox.
- Revenue & GMV dashboards.
- Financial adjustments ledger.

### 3.8 Concierge desk
See [§12 §8](./12-concierge-support.md#8-tooling--concierge-console-).

### 3.9 Feature flags
- Toggle features by user, by region, by role, by percentage.
- Flag changes require reason + audit entry.
- Emergency kill-switches: booking-freeze, signup-freeze, payment-freeze.

### 3.10 System health
- Job queues, webhook lag, email deliverability, push-delivery state.
- Incident banner surface (internal + maintenance-mode public).

### 3.11 Release console
- Deployment history.
- Feature-flag rollout status.
- Database-migration status.

---

## 4. Safety patterns 🔒

Every destructive or large-surface action follows the same pattern:

1. **Reason code** required.
2. **Confirm modal** with affected-entity count shown.
3. **Audit entry** written with actor, before/after, reason.
4. **Undo window** where reversible (cancellations within 1 hour, etc.).
5. **Rate limits** on privileged endpoints per role.

No admin has a "delete user" button that runs instantly. All high-impact actions are at least two-step.

---

## 5. Data model

Most data reuses module tables. Admin-specific:

### `public.audit_log`
Comprehensive append-only log — already introduced in [§11](./11-trust-safety.md).

### `public.feature_flags`
| `key`, `default_enabled`, `rollout` (jsonb — rules per role/region/percentage), `updated_by`, `updated_at` |

### `public.staff_sessions`
Internal sessions include role snapshot, elevation (if any), expiry.

### `public.maintenance_windows`
Planned downtime / region-restricted changes; drives public status banner.

### `public.reason_codes`
Canonical reason codes for refunds, credits, suspensions — used by KPIs.

---

## 6. API surface

All admin endpoints are namespaced under `/admin/*` and gated by role middleware. They are not documented publicly.

- `GET /admin/search?q=` — global search.
- `GET /admin/users/:id` — inspector.
- `POST /admin/users/:id/suspend` / `unsuspend`.
- `POST /admin/listings/:id/moderate`.
- `POST /admin/bookings/:id/{cancel,refund,credit,escalate}`.
- `POST /admin/incidents/:id/{assign,resolve}`.
- `POST /admin/feature-flags/:key`.
- `GET /admin/audit?filters=`.

All requests carry `X-Actor-Reason` header captured in audit.

---

## 7. Access control

- Staff-only routes behind **SSO** (Google Workspace or equivalent) + **mandatory 2FA** (passkey or TOTP).
- Role assignment gated by superadmin with two-person approval above `moderator`.
- **Break-glass** procedure for emergency superadmin access — logged, reviewed within 24h.
- Read-only replicas for analytics; writes through the admin API only.
- IP allowlisting for destructive endpoints (optional, dependent on op posture).

---

## 8. Observability

- All admin actions → audit log + structured log → reviewed weekly by ops lead.
- Anomaly detection on staff actions (bulk refunds at 3am, unusual access patterns).
- Every role has KPIs shown in the console (tickets resolved, moderation latency, finance close time).

---

## 9. Edge cases & failure modes

- **Shared-account login.** Disallow; detect (multiple device fingerprints on one staff account).
- **Insider abuse.** Audit anomaly alerts + superadmin review queue.
- **Leaked admin endpoint URL.** All `/admin/*` routes require role check at edge; no security-through-obscurity.
- **Accidental bulk action.** Two-step confirm + count display + undo window.
- **Data-integrity fix needed directly in DB.** Disallowed except via tracked migration or admin API. If absolutely needed, done via `superadmin` break-glass with 24h review.
- **Outage of admin console.** Concierge has an email-only fallback path for refunds; finance has a spreadsheet fallback with post-hoc import.

---

## 10. KPIs

- **Moderation queue SLA** (time-in-queue by entity type).
- **Audit-log coverage** (every privileged endpoint writes one — target 100%).
- **Mean time to resolve** by incident tier.
- **Finance close time** (monthly book close).
- **Break-glass usage rate** (target near-zero).
- **Staff tool CSAT** — quiet but real; bad internal tools degrade the guest experience.

---

## 11. Dependencies

- Every module.
- **SSO provider**: Google Workspace (likely) or Okta at scale.
- **Analytics warehouse**: read replica + BI tool (Metabase / Hex / Looker) — separate from the admin console.
- **Feature-flag platform**: self-hosted table + library (simple) or third-party (LaunchDarkly / PostHog) at scale.

---

## 12. v1 scope

- 🔲 Not in v1. Ops run on Supabase studio + manual scripts for v1 volumes.
- ✅ `audit_log` table exists so privileged actions are captured from day 1 even without a UI.
- ✅ Reason-code scaffolding exists for refunds and cancellations.

---

## 13. Open questions

- 🔲 Build console from scratch or adopt a platform (Retool, Internal.io)?
- 🔲 Self-serve moderator actions (e.g. auto-approve listings that pass all checks) vs full-human review — threshold?
- 🔲 Staff-observability boundary with user privacy (what we can see, what we log).
- 🔲 Outsourced vs. in-house moderation — scale decision.
- 🔲 Disaster-recovery runbook ownership and cadence of drills.
