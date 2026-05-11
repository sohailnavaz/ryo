# 02 · Auth & Identity

> How a person becomes a trusted Ryo user — guest, host, or staff.

| Field         | Value                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Module ID     | `02-auth-identity`                                                                              |
| Status        | ✏️ Draft                                                                                        |
| v1 scope      | Guest signup + session + basic profile. Host KYC is v2.                                         |
| Owner         | TBD                                                                                             |
| Linked        | [11 trust-safety](./11-trust-safety.md), [13 host-tools](./13-host-tools.md), [06 payments](./06-payments-payouts.md) |
| Last updated  | 2026-04-23                                                                                      |

---

## 1. Purpose & Ryo alignment

Trust starts at the account boundary. This module defines **who a user is, what they can do, and how verified they are** — for guests, hosts, and staff. Verification depth is graduated: guests need an account to book, hosts need full KYC to list, admins need SSO + 2FA to operate.

Aligns with brand differentiators #1 (verified hosts) and #5 (calm, trustworthy UI) from [branding §3.3](./branding.md#33-differentiators-the-better-than-airbnb-axes-).

---

## 2. User stories

### Guest
- As a guest, I want to sign up with email or a social account in under 30 seconds so I can start searching.
- As a guest, I want a secure passwordless option (magic link / passkey) so I don't manage another password.
- As a guest, I want to add and verify a phone number before my first booking so the host can reach me at arrival.
- As a guest, I want to be able to sign out remotely from a lost device.

### Host
- As a prospective host, I want a clear identity-verification flow (ID + selfie + address) that feels respectful, not intrusive.
- As a host, I want to know which verification step I am on and how long the rest will take.
- As a host, I want a single identity across all my properties.

### Admin / Concierge
- As a concierge, I want to assume a read-only view of a guest's account to help them without touching their password.
- As an admin, I want all staff access gated behind SSO + 2FA.

---

## 3. Roles & permissions

| Role         | Can                                                                                 |
| ------------ | ----------------------------------------------------------------------------------- |
| `guest`      | Browse, save favourites, book, message host, leave reviews                          |
| `host`       | All guest rights + create listings, manage calendar, receive payouts                |
| `concierge`  | All guest rights + read-only assist mode across any user; open tickets; issue credits up to a cap |
| `moderator`  | Review listings, reviews, messages; moderate content                                |
| `admin`      | All of the above + user suspension, refunds, financial reports                      |
| `superadmin` | Feature flags, role management, audit access                                        |

A user can hold more than one role; `guest` is implicit for all humans.

---

## 4. Core flows

### 4.1 Guest signup (v1)
1. User enters email (or taps Apple / Google / Phone).
2. System sends magic link (email) or OTP (phone).
3. On click / verify, session created; profile row written with minimal fields.
4. First-run prompts: preferred language, currency, display name.
5. Phone verification requested before first booking (not at signup).

### 4.2 Passwordless + passkey (preferred)
- Magic links as default. Password is opt-in.
- Passkeys (WebAuthn) offered on compatible devices.
- OTP via SMS is fallback where email is unreliable.

### 4.3 Host verification (v2)
1. User upgrades account to host (`role += 'host'`).
2. Verification wizard:
   - Government-issued ID (passport, driver's licence, Aadhaar for India) → captured via third-party KYC provider.
   - Selfie liveness check → compared to ID photo.
   - Address proof (utility bill or bank statement).
   - Property-right proof (deed, rental agreement, or property-manager authorisation).
3. Each step is independently re-verifiable (ID can expire; address can change).
4. Host is **listed-eligible** only when all four are `verified`.

### 4.4 Session & device management
- Sessions stored server-side with device fingerprint, IP, geo.
- Users can view active sessions and sign out remotely.
- Risky actions (change email, change payout bank, new device in new country) require step-up re-auth.

### 4.5 Account recovery
- Multi-factor recovery: email + phone + recovery codes.
- No account is recoverable from a single compromised channel alone.
- Lost-account flow requires ID check for accounts with bookings or payouts.

### 4.6 Deletion / data export
- Full export of personal data (GDPR + India DPDPA).
- Soft-delete with 30-day grace; hard-delete after.
- Financial records retained per tax-law minimum, anonymised.

---

## 5. Data model (Supabase / Postgres)

### `auth.users` (Supabase-managed)
Supabase handles the credential table. We add:

### `public.profiles`
| Column              | Type                    | Notes                                      |
| ------------------- | ----------------------- | ------------------------------------------ |
| `id`                | `uuid PK → auth.users`  | 1:1 with auth user                         |
| `display_name`      | `text`                  | User-chosen                                |
| `avatar_url`        | `text`                  | Storage ref                                |
| `preferred_locale`  | `text`                  | ICU locale, e.g. `en-IN`, `ja-JP`          |
| `preferred_currency`| `text`                  | ISO 4217                                   |
| `phone_e164`        | `text`                  | E.164 format; nullable until verified      |
| `phone_verified_at` | `timestamptz`           |                                            |
| `id_verified_at`    | `timestamptz`           | Host KYC                                   |
| `roles`             | `text[]`                | `['guest']`, `['guest','host']`, etc.      |
| `is_suspended`      | `boolean default false` |                                            |
| `created_at`        | `timestamptz default now()` |                                        |
| `updated_at`        | `timestamptz`           |                                            |

### `public.kyc_verifications`
| Column             | Type          | Notes                                              |
| ------------------ | ------------- | -------------------------------------------------- |
| `id`               | `uuid`        |                                                    |
| `user_id`          | `uuid FK`     |                                                    |
| `check_type`       | `text`        | `id`, `selfie`, `address`, `property_right`        |
| `status`           | `text`        | `pending` / `passed` / `failed` / `expired`        |
| `provider`         | `text`        | Third-party KYC vendor id                          |
| `provider_ref`     | `text`        | External check id                                  |
| `expires_at`       | `timestamptz` |                                                    |
| `created_at`       | `timestamptz` |                                                    |

### `public.sessions_audit`
Append-only log of session events (create, revoke, step-up).

### `public.role_audit`
Append-only log of role grants and revocations — with actor and reason.

---

## 6. API surface (high-level)

- `auth.signUp(email | phone | oauth)` → Supabase
- `auth.signInWithOtp`, `auth.signInWithPassword`, `auth.signInWithPasskey`
- `rpc.profile_complete_onboarding({locale, currency, display_name})`
- `rpc.phone_start_verification(e164)` → sends OTP
- `rpc.phone_confirm_verification(code)`
- `rpc.kyc_start(check_type)` → returns hosted URL from vendor
- `rpc.kyc_webhook` → vendor → updates `kyc_verifications`
- `rpc.session_list()` / `rpc.session_revoke(id)`
- `rpc.account_request_deletion()` / `rpc.account_export()`

Row-level security: every table has RLS; users can only read/write their own rows except staff with role-gated policies.

---

## 7. Edge cases & failure modes

- **Email typo at signup.** Magic link never arrives; provide a "change email" CTA on the verification screen.
- **User signs up on mobile, opens link on desktop.** Cross-device session hand-off must work.
- **Same email used by two people (rare, happens).** Block the second signup and direct to recovery.
- **KYC document expired.** Re-trigger just the expired check, not full re-verification.
- **KYC false negative.** Manual-review queue with concierge override.
- **Suspended host with active bookings.** Bookings are not cancelled automatically; concierge triages each.
- **Lost device.** Session list + revoke, plus recovery-code flow.
- **India-specific Aadhaar handling.** Use masked Aadhaar via DigiLocker; never store the raw number.

---

## 8. KPIs

- **Signup conversion** (landing → verified email).
- **First-booking activation** (signup → first booking within 14 days).
- **Verified-host share** (% of hosts with full KYC).
- **Password-reset rate** (lower is better — proxy for passwordless adoption).
- **Account-takeover incidents** per 10k active users (should trend to 0).

---

## 9. Dependencies

- **Supabase Auth** — session, JWT, OAuth providers.
- **KYC provider** (TBD — candidates: Onfido, Sumsub, Persona, HyperVerge for India).
- **SMS provider** (TBD — Twilio global, or MSG91/Gupshup for India).
- **Email provider** — see [09 notifications-mail](./09-notifications-mail.md).
- **Trust & Safety** — [11 trust-safety](./11-trust-safety.md) consumes verification status.

---

## 10. v1 scope

- ✅ Email / OAuth signup
- ✅ Magic link
- ✅ Basic profile (display name, avatar, locale, currency)
- ✅ Session + remote sign-out
- ✅ Phone verification before first booking
- 🔲 Passkeys — scaffold if cheap, otherwise v2
- 🔲 Host KYC — v2 (no host flow in v1)
- 🔲 Staff SSO + 2FA — v2 (no admin console in v1)

---

## 11. Open questions

- 🔲 KYC vendor pick — need India-aware, global-capable, reasonable pricing.
- 🔲 Aadhaar: DigiLocker integration or offline-XML? Legal review needed.
- 🔲 Phone-only signup (no email) — support it, or require email as primary?
- 🔲 Re-verify cadence — how often must host-KYC refresh? (Default: 24 months.)
- 🔲 Handling of users under 18 — block, or allow browsing but not booking?
