# Ryo

> ### *Just Ryo it.*
> Short-term stays, hosted — not just listed. Clean, minimal, luxurious; playful where it's earned.

> *Living document.* Update whenever a brand decision is made, changed, or clarified. This file is the single source of truth for all Ryo branding. See [§17](#17-how-to-update-this-document) for how to edit it.

---

## At a Glance

|                      |                                                                            |
| -------------------- | -------------------------------------------------------------------------- |
| **Name**             | Ryo — from Japanese 旅 (*ryo*), *journey / travel*                         |
| **Tagline** 🔒       | *Just Ryo it.*                                                             |
| **Promise**          | Every stay hosted — work trip, vacation, staycation, friends, family, solo |
| **Aesthetic**        | Clean · Minimal · Luxurious · Warm · Playful where earned                  |
| **Service ethos**    | *Omotenashi* — anticipate the guest's need before it is spoken             |
| **Codebase alias**   | `bnb` → `ryo` (migration tracked in [§12](#12-naming-migration-bnb--ryo))  |
| **Doc version**      | `0.2.0` — last updated 2026-04-23                                          |
| **Owner**            | Makuta Developers — dm@makutadevelopers.com                                |

---

## Table of Contents

- [0. Open Questions](#0-open-questions)
- [1. Brand Story](#1-brand-story)
- [2. Mission, Vision, Values](#2-mission-vision-values)
- [3. Positioning](#3-positioning)
- [4. Audience](#4-audience)
- [5. Messaging Framework](#5-messaging-framework)
- [6. Voice & Tone](#6-voice--tone)
- [7. Visual Identity](#7-visual-identity)
- [8. Digital Presence](#8-digital-presence)
- [9. Localization & Brand Adaptation](#9-localization--brand-adaptation)
- [10. Email & Collateral](#10-email--collateral)
- [11. Do's and Don'ts](#11-dos-and-donts)
- [12. Naming Migration: `bnb` → `ryo`](#12-naming-migration-bnb--ryo)
- [13. Trademark & Legal](#13-trademark--legal)
- [14. Partnerships & Co-branding](#14-partnerships--co-branding)
- [15. Asset Inventory](#15-asset-inventory)
- [16. Design Tokens](#16-design-tokens-source-of-truth)
- [17. How to Update This Document](#17-how-to-update-this-document)
- [18. Changelog](#18-changelog)

---

## Legend

Markers used throughout this document:

|   |                                                                                  |
| - | -------------------------------------------------------------------------------- |
| 🔒 | **Locked** — decided; do not change without a changelog entry and team sign-off  |
| ✏️ | **Draft** — proposed, validating, open to revision                               |
| 🔲 | **TBD** — placeholder so the section exists; decision pending                    |
| ⭐ | Recommended / primary choice within a shortlist                                  |

---

## 0. Open Questions

The short list of branding decisions that are **not yet made**. Keep this section at the top so it is always visible. Move items to their proper section once resolved, and log the decision in the [Changelog](#18-changelog).

- 🔲 Final logo (wordmark + symbol) — not yet designed
- 🔲 Primary hero accent: terracotta vs. ink navy (both currently defined in §7.2)
- 🔲 Final social handles (@ryo taken on most platforms — need fallback pattern)
- 🔲 Trademark filing strategy (classes 39 / 42 / 43)
- 🔲 Photography direction locked (stock vs. commissioned)
- 🔲 Launch markets locked (India + Southeast Asia is the current leaning — see §4.3)
- 🔲 Email provider locked (Resend vs. AWS SES — see §10)

> *Resolved in v0.2.0 and moved to their proper sections:* tagline pick ([§5.1](#51-tagline-)), voice-playfulness boundary ([§6.2](#62-tone-varies-by-context-)), clean-minimal-luxurious design ethos ([§7.0](#70-design-ethos-)).

---

## 1. Brand Story

### 1.1 Name 🔒

**Ryo** — from Japanese 旅 (*ryo* / *tabi*), meaning *journey* or *travel*.

The name carries three ideas simultaneously:
- **Journey** — the wanderlust instinct at the heart of travel
- **Ryokan (旅館)** — the traditional Japanese inn, where a guest is hosted like family
- **Omotenashi (おもてなし)** — the Japanese philosophy of anticipating a guest's needs before they are spoken. This is our service ethos.

### 1.2 Origin rationale 🔒

Airbnb scaled by normalizing strangers hosting strangers. That worked — but as it scaled, the *hosting* became transactional. Ryo is built around the opposite idea: **a stay should feel like being a guest, not a customer**. The Japanese hospitality tradition (*omotenashi*) is the most refined expression of that idea in the world, and the name signals it without having to explain it.

### 1.3 One-sentence brand definition ✏️

> Ryo is a short-term-stays platform where travellers are hosted, not just accommodated.

---

## 2. Mission, Vision, Values

### 2.1 Mission ✏️
Make every stay feel like a home far from home.

### 2.2 Vision ✏️
A world where travelling to an unfamiliar place never means feeling like a stranger.

### 2.3 Values ✏️
1. **Hospitality first** — service quality is the product, not a feature.
2. **Curation over scale** — a smaller list of vetted homes beats an infinite list of unknowns.
3. **Trust is earned, not claimed** — verify everything the guest is about to trust.
4. **Calm design** — the interface should lower anxiety, not raise excitement.
5. **Quiet luxury** — luxurious by restraint, not by ornament. Space, typography, craft, calm — never gold, gloss, or showiness.
6. **Local respect** — every host, every city, every culture is treated on its own terms.

---

## 3. Positioning

### 3.1 Category
Short-term-rental marketplace (Airbnb, Vrbo, Booking.com Homes category).

### 3.2 Positioning statement ✏️

> For travellers who want a stay that feels like it was prepared for them — not just listed — Ryo is a curated short-term-rental platform that treats hospitality as a product, not a policy. Unlike Airbnb, which scaled by letting anyone host anyone, Ryo vets every host, supports every guest, and stands behind every stay.

### 3.3 Differentiators (the "better than Airbnb" axes) 🔒
1. **Verified hosts** — real vetting, not a self-checked box.
2. **24/7 multilingual concierge** — a human answers, in your language, within SLA.
3. **Service guarantees** — arrival protection, re-book protection, quality refunds.
4. **Curation** — boutique-tier listings surfaced first, editorial presentation.
5. **Calm, trustworthy UI** — no dark patterns, clear pricing up-front, no surprise fees.

---

## 4. Audience

### 4.1 Primary traveller persona ✏️
- 28–50, medium-to-high disposable income
- Travels 3–10 times a year, mix of leisure and work
- Has been burned by Airbnb at least once (cleaning fees, late-cancel hosts, poor support)
- Willing to pay a premium for reliability and service
- English + at least one local language

### 4.2 Primary host persona ✏️
- Owns or manages 1–10 properties
- Takes hospitality seriously; currently on multiple platforms
- Frustrated by noisy guests, opaque ranking algorithms, slow payouts
- Values a platform that protects their property and their brand

### 4.3 Geographic focus 🔲
- Launch markets: TBD (India-based team suggests India + Southeast Asia as v1)
- Global ambitions from day one — i18n/l10n is foundational, not an afterthought

---

## 5. Messaging Framework

### 5.1 Tagline 🔒

> # *Just Ryo it.*

**Primary tagline. Locked 2026-04-23 (v0.2.0).**

**Brief it was written against:** playful, vibes-first, no heavy philosophy. Works for every kind of trip — work, vacation, staycation, friend trip, family, solo. Reads like a permission slip, not an essay. Brand baked in.

**Usage rules:**
- Write as *Just Ryo it.* — italics optional, period required, no exclamation mark.
- Works as: hero headline, app-store strapline, social sign-off, button microcopy ("Just Ryo it →"), campaign anchor.
- Do **not** translate. Capitalise `Ryo` in every locale.
- Do **not** pair with another tagline in the same frame. One line speaks at a time.
- Do **not** sit it on a cluttered background — it needs quiet space around it.

#### Secondary lines (for campaigns, headers, social captions) ✏️

Usable in rotation under the primary tagline. Do not promote to primary without a changelog entry.

| Line                          | Best for                                  |
| ----------------------------- | ----------------------------------------- |
| *Ryo with it.*                | Social captions, lifestyle beats          |
| *Here we Ryo.*                | Group / friend-trip content               |
| *Good to Ryo.*                | Confirmation moments, short headers       |
| *Ready, set, Ryo.*            | Onboarding, first-booking energy          |
| *Go. Stay. Repeat.*           | Loyalty, repeat-traveller campaigns       |
| *Out of office, into Ryo.*    | Work-to-leisure / bleisure framing        |
| *Pack light. Stay heavy.*     | Curated-stays / premium tier              |
| *Book it. Bye.*               | High-speed booking UX beat                |
| *Stays that just work.*       | Reliability / service-quality proof       |
| *Big stay energy.*            | Social-first, culture-moment copy         |
| *Grab a stay.*                | CTA microcopy, search empty states        |

<details>
<summary><b>Retired shortlists</b> (do not revive without reason)</summary>

- **v0.1.2** (philosophical / universal): *"However you go."*, *"Wherever. Hosted."*, *"Any trip. Hosted."*, *"Every way to stay."*, *"For the way you go."*, *"Made for every stay."*, *"Go. Be hosted."*, *"Every trip, hosted."* — too logic-forward.
- **v0.1.1** (*omotenashi*-focused): *"You were expected."*, *"Be hosted."*, *"Hosted, not housed."*, *"The art of arrival."*, *"Stay like a regular."*, *"Hosting, perfected."*, *"Before you ask."*, *"Travel with a place to land."* — too premium-leisure-coded.
- **v0.1.0**: *"A home, far from home."* (cliché), *"Travel, the art of being hosted."*, *"Stay like you belong."*, *"Hosted properly."*, *"The Ryo way."*

</details>

### 5.2 Elevator pitch (30 sec) ✏️

> Ryo is a short-term-stays platform built around one idea — that a great stay should feel like being a guest, not a customer. Every host is vetted, every guest is supported by a 24/7 multilingual concierge, and every stay is backed by service guarantees. It's what Airbnb would look like if hospitality — not scale — was the product.

### 5.3 Key messages ✏️
- **For travellers**: *"You're not booking a property. You're being hosted."*
- **For hosts**: *"Host on a platform that protects your home and your name."*
- **For press/investors**: *"We are rebuilding short-term rentals around service, not listings volume."*

---

## 6. Voice & Tone

### 6.1 Voice (constant) 🔒
- **Warm but precise** — welcoming without being saccharine
- **Confident, not loud** — never use exclamation marks for excitement
- **Respectful** — of the guest, the host, the place, the language
- **Quiet expertise** — we sound like a good concierge, not a salesperson

### 6.2 Tone (varies by context) 🔒

| Context                                  | Tone                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Taglines / social / hero CTAs            | **Playful, short, permission-slip energy** — e.g. *"Just Ryo it."* ⭐          |
| Marketing / hero body copy               | Editorial, poetic, restrained                                                 |
| Product UI                               | Clear, short, human; a touch of play is allowed in empty states and success   |
| Transactional email                      | Warm-professional; lead with the useful fact                                  |
| Support conversation                     | Calm, empathetic, accountable — never deflect                                 |
| Error / failure states                   | Honest, specific, apologetic, with a next step                                |
| Trust & safety / payments / legal        | Precise, plain, reassuring — never clever                                     |
| Host-facing content                      | Peer-to-peer, respectful, operationally precise                               |

#### Where playful lives, where it doesn't 🔒

**Playful is permitted in:** tagline, hero headlines, app-store copy, social posts, onboarding celebration moments, empty-state microcopy, first-booking / milestone copy.

**Playful is forbidden in:** transactional email, booking confirmations, support conversations, trust & safety copy, host policies, legal surfaces, payment and refund flows, error states where real money or real travel is involved.

> **The simple test:** if a guest is standing at the door of a home they paid for and something just went wrong, playful is insulting. Be calm, be specific, be accountable. Save the playfulness for the moments that deserve it.

### 6.3 Do / Don't

✅ *"Your host has confirmed your arrival for Friday 4pm."*
❌ *"Yay! You're all set! 🎉"*

✅ *"We couldn't reach your host. A concierge is now handling this. Expect an update within 30 minutes."*
❌ *"Oops! Something went wrong."*

---

## 7. Visual Identity

### 7.0 Design ethos 🔒

Ryo's design is **clean, minimal, luxurious**. Three principles apply to every surface — app, web, email, marketing, deck. These override anything in the subsections below that conflicts.

| Principle       | What it means for us                                                                                                   | What it rules out                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Clean**       | Every element earns its place. One idea per screen. Generous whitespace, strong hierarchy, legible at a glance.        | Decorative clutter, surplus colour, background patterns, busy textures           |
| **Minimal**     | Less on the screen means more attention for what matters — the photo, the price, the host. Controls fade, content leads. | Info-dense dashboards, sidebars of filters, badges for every attribute          |
| **Luxurious**   | Quality felt through craft: warm palette, editorial type, paced motion, real photography, honest pricing, calm UX.    | Gold gradients, glossy effects, ornate flourishes, "premium" clichés, dark patterns |

> **Quiet luxury, not loud luxury.** Ryo is luxurious in the way a well-made linen sheet is luxurious — not in the way a gold-plated faucet is. The feeling is *restraint*, *space*, and *care*. If something feels "fancy," it is probably wrong.

**The three-question test.** Before shipping any screen, email, asset, or spec, answer:

1. Is every element pulling its weight? *(Clean)*
2. Can I remove something without losing meaning? *(Minimal)*
3. Does it feel considered, not decorated? *(Luxurious)*

If any answer is "no," revise before shipping.

### 7.1 Logo 🔲

Not yet designed. Placeholder: lowercase wordmark `ryo` in Fraunces, 500 weight, letter-spacing `-0.02em`. To be replaced when a proper logo and symbol are produced.

When designed, capture here:
- SVG wordmark (light + dark variants)
- SVG symbol / favicon
- Clear-space rules (min 0.5× cap height around mark)
- Minimum sizes (16px favicon, 24px app icon, 40px marketing)
- Do / Don't examples

### 7.2 Colour palette ✏️

Hero accent is **not yet locked** — §0 open question. All other tokens are draft.

#### Core

| Role             | Name            | Hex        | Usage                                         |
| ---------------- | --------------- | ---------- | --------------------------------------------- |
| Hero / action    | Terracotta      | `#C87156`  | Primary CTAs, key accents, brand moments      |
| Hero alternate   | Ocean Teal      | `#1F5A6B`  | Alternate accent; candidate for hero          |
| Ink (text)       | Ink Navy        | `#0E1A2B`  | Primary text, headings                        |
| Cream (surface)  | Warm Cream      | `#FAF6F0`  | Default background — never pure white         |
| Sand (surface 2) | Sand            | `#EFE7DA`  | Secondary surface, cards                      |

#### Neutrals (warm greys only — never pure grey)

| Name     | Hex        | Usage                              |
| -------- | ---------- | ---------------------------------- |
| Warm 900 | `#1C1A17`  | Highest-contrast text on cream     |
| Warm 700 | `#4A4540`  | Body text                          |
| Warm 500 | `#8A837B`  | Secondary text                     |
| Warm 300 | `#CFC7BD`  | Borders, dividers                  |
| Warm 100 | `#EFEAE3`  | Subtle backgrounds                 |

#### Semantic

| Role     | Hex        |
| -------- | ---------- |
| Success  | `#2E7D5B`  |
| Warning  | `#C98A2B`  |
| Danger   | `#B4432F`  |
| Info     | `#356A8C`  |

#### Rules 🔒
- Never use pure black (`#000`) or pure white (`#FFF`) in UI surfaces.
- Never use cold grey — all neutrals are warm-biased.
- Terracotta is reserved for genuine brand moments and primary CTAs. Using it everywhere kills its signal.
- Every foreground/background pair must meet WCAG AA (4.5:1 for body, 3:1 for large text).

### 7.3 Typography 🔒

| Role             | Family                        | Notes                                               |
| ---------------- | ----------------------------- | --------------------------------------------------- |
| Display / H1–H2  | **Fraunces** (variable)       | Soft, editorial serif — carries the brand character |
| Heading / Body   | **Inter** (variable)          | Clean, neutral, huge multilingual coverage          |
| Numeric / tabular| **JetBrains Mono**            | Prices, codes, IDs                                  |
| Japanese accent  | **Noto Serif JP** (optional)  | Only for the occasional 旅 mark — never body copy   |

#### Scale (web, rem-based) ✏️

| Token  | Size  | Line-height | Usage                            |
| ------ | ----- | ----------- | -------------------------------- |
| `xs`   | 0.75  | 1.4         | Micro-labels                     |
| `sm`   | 0.875 | 1.5         | Secondary text                   |
| `base` | 1     | 1.6         | Body                             |
| `lg`   | 1.125 | 1.55        | Lead paragraphs                  |
| `xl`   | 1.25  | 1.4         | Small headings                   |
| `2xl`  | 1.5   | 1.3         | H3                               |
| `3xl`  | 2     | 1.2         | H2                               |
| `4xl`  | 2.75  | 1.1         | H1                               |
| `5xl`  | 3.75  | 1.05        | Hero (Fraunces, `optical 96`)    |

Use Fraunces variable axes thoughtfully: `SOFT 80–100`, `opsz` at display sizes, `wght 400–600`.

### 7.4 Spacing & grid ✏️

- **Base unit**: 4px
- **Spacing scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- **Grid**: 12-column, 1280px max container, 32px gutter at desktop, 16px at mobile
- **Radii**: `sm 6px`, `md 10px`, `lg 16px`, `xl 24px`, `full` (pills)
- Generous whitespace is a brand principle, not a luxury. Do not compress to fit more.

### 7.5 Iconography 🔲

- Library: **Lucide** (base) + custom set for Ryo-specific concepts (verified-host shield, concierge, ryokan mark, stay-guarantee badge)
- Stroke: 1.5px, rounded caps
- Size: 16 / 20 / 24 px
- Custom brand icons live in `packages/ui/icons/` once built

### 7.6 Photography & imagery ✏️

- **Principle**: real homes, real light, real moments — no staged "lifestyle" stock
- **Style**: warm colour grading, golden-hour bias, soft grain
- **Composition**: wide-angle for space, intimate close-ups for detail (bed linen, coffee pot, a key on a table)
- **People**: rarely face-on; often implied (a cup of tea, a hat on a hook)
- **Forbidden**: harsh flash, oversaturated HDR, pure-white walls, model-home sterility

### 7.7 Motion ✏️

- **Principle**: calm confidence. Motion clarifies, never decorates.
- **Durations**: 150ms (micro), 250ms (standard), 400ms (entrance)
- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` as default — soft ease-out
- **Forbidden**: bouncy springs, card-rotation on hover, auto-playing motion, motion that runs longer than 500ms

### 7.8 Accessibility 🔒

- WCAG AA minimum, AAA where reachable
- All interactive elements ≥ 44×44 px tap target
- Focus rings always visible (2px terracotta outline with 2px offset)
- `prefers-reduced-motion` honoured — disables all non-essential motion
- Colour is never the only signal (pair with icon / text)
- Language tagged on every `<html lang>` and on mixed-language nodes

### 7.9 Dark mode ✏️

Philosophy: "a first-class cabin at night" — deep, warm, low-contrast.

| Role         | Hex        |
| ------------ | ---------- |
| Background   | `#0E1A2B`  |
| Surface      | `#16233A`  |
| Surface 2    | `#1E2E48`  |
| Text primary | `#F3ECE0`  |
| Text secondary | `#BDB4A6` |
| Hero accent  | `#E28B6F` (terracotta lightened for contrast) |

---

## 8. Digital Presence

### 8.1 Domains ✏️

| Role                  | Domain            | Status                          |
| --------------------- | ----------------- | ------------------------------- |
| Product / app         | `ryo.stay`        | Available — to register         |
| Marketing site        | `ryostays.com`    | Available — to register         |
| Defensive redirect    | `joinryo.com`     | Available — to register         |
| Defensive redirect    | `tryryo.com`      | Available — to register         |
| India market          | `ryo.co.in`       | Available — to register         |
| **Aspirational**      | `ryo.com`         | Taken (AWS-parked) — pursue post-traction via broker |

### 8.2 Social handles 🔲

Canonical handle preference: `@ryo` → `@ryostays` → `@ryo.stay` → `@weareryo`.

| Platform   | Handle        | Status |
| ---------- | ------------- | ------ |
| Instagram  | 🔲            | TBD    |
| X / Twitter| 🔲            | TBD    |
| LinkedIn   | 🔲            | TBD    |
| TikTok     | 🔲            | TBD    |
| YouTube    | 🔲            | TBD    |
| Pinterest  | 🔲            | TBD    |

### 8.3 Email addresses ✏️

Once `ryostays.com` is live:
- `hello@ryostays.com` — general
- `concierge@ryostays.com` — 24/7 support
- `hosts@ryostays.com` — host relations
- `press@ryostays.com` — media
- `trust@ryostays.com` — safety and abuse reports

---

## 9. Localization & Brand Adaptation

The brand must feel native — not translated — in every supported market.

### 9.1 Language plan ✏️
- v1: English, Hindi, Spanish, French, Arabic, Japanese
- v2: Portuguese, German, Italian, Indonesian, Thai, Mandarin
- All locales must support **RTL** (Arabic, Hebrew), **CJK line-break rules**, and **currency/number formatting per ICU**.

### 9.2 Brand-voice adaptation rules 🔒
- Translate meaning, not words. Idioms are re-written by a native speaker, not machine-translated.
- Hospitality norms differ: German is direct, Japanese is honorific, Hindi mixes formal and warm. Tone must adapt; voice principles do not.
- Currency is always shown in the user's preferred currency with a quiet second line in the host's currency for hosts.

### 9.3 Name treatment across scripts ✏️
- Latin: `Ryo`
- Japanese accent use: 旅 (only in hero moments, never body)
- Other scripts: transliteration TBD (e.g. Devanagari, Arabic, Cyrillic)

---

## 10. Email & Collateral 🔲

Every outbound communication is a brand surface. Templates live under `packages/ui/emails/` once built.

Required templates:
- Welcome (guest / host)
- Booking confirmation
- Arrival instructions (24h before)
- Post-stay review request
- Support follow-up
- Concierge handoff
- Payout confirmation (host)
- Listing approved / rejected (host)
- Trust & safety notice

Standards:
- Locale-routed per user preference
- Plain-text fallback for every HTML email
- SPF / DKIM / DMARC configured on `ryostays.com`
- Provider: Resend or AWS SES (TBD)

---

## 11. Do's and Don'ts

### Do
- Lead with the guest's goal, not ours.
- Use warm cream as the default page background.
- Prefer editorial serif for emotional moments; sans for functional moments.
- Show the *total* price, including fees, always.
- Name the person on the other end of support conversations.

### Don't
- Don't use emoji in product UI or marketing headlines. (Transactional emails may use 1 emoji max, if locale-appropriate.)
- Don't use "Oops!" or "Whoops!" — ever.
- Don't use stock photography of staged families laughing around a table.
- Don't pair terracotta with ocean teal at equal weight — pick one as hero.
- Don't translate the word "Ryo".

---

## 12. Naming Migration: `bnb` → `ryo`

The codebase currently uses `bnb` as its project/package name. This section tracks the rename. Update statuses as each is completed.

| Target                                       | Status |
| -------------------------------------------- | ------ |
| Root `package.json` → `"name": "ryo"`        | 🔲     |
| `apps/web` package name `@bnb/web` → `@ryo/web` | 🔲  |
| `apps/mobile` package + Expo slug             | 🔲     |
| `packages/*` names `@bnb/*` → `@ryo/*`        | 🔲     |
| Turbo filters in root scripts                 | 🔲     |
| `README.md` title and copy                    | 🔲     |
| Expo `app.json` name, slug, scheme            | 🔲     |
| iOS bundle id `com.makuta.bnb` → `com.makuta.ryo` | 🔲 |
| Android package id                            | 🔲     |
| Supabase project name / URL alias             | 🔲     |
| Environment variable prefixes (if any `BNB_`) | 🔲     |
| Deep-link scheme `bnb://` → `ryo://`          | 🔲     |
| Repo/folder rename (`/bnb` → `/ryo`)          | 🔲 (last step — breaks paths) |

> Do not start the rename piecemeal. Schedule it as a single PR once domains are registered and a logo wordmark is ready.

---

## 13. Trademark & Legal 🔲

- Trademark classes to file: **39** (travel), **43** (temporary accommodation), **42** (SaaS platform)
- Jurisdictions (priority): India, US, EU, Japan, Singapore
- Action owner: TBD
- Counsel: TBD

---

## 14. Partnerships & Co-branding 🔲

Placeholder for future co-brand rules — when Ryo partners with another brand (a boutique hotel group, a travel-insurance provider, a destination authority), this section captures lockup rules, minimum clear space around a co-lockup, and the approval process.

---

## 15. Asset Inventory 🔲

Once assets exist, list them here with paths so nothing gets lost.

| Asset                           | Path                                        | Format       |
| ------------------------------- | ------------------------------------------- | ------------ |
| Primary wordmark                | `packages/ui/brand/ryo-wordmark.svg`        | SVG          |
| Symbol / favicon                | `packages/ui/brand/ryo-mark.svg`            | SVG          |
| App icon (iOS)                  | `apps/mobile/assets/icon-ios.png`           | 1024×1024    |
| App icon (Android)              | `apps/mobile/assets/icon-android.png`       | 1024×1024    |
| OG image (1200×630)             | `apps/web/public/og.jpg`                    | JPG          |
| Email logo                      | `packages/ui/emails/assets/logo.png`        | PNG @2x      |
| Brand photography set           | `apps/web/public/brand/`                    | JPG/WebP     |

---

## 16. Design Tokens (source of truth)

When tokens are implemented in code, they live in `packages/ui/theme/tokens.ts` and `packages/config/tailwind.preset.js`. This doc is the **human-readable** source; the code is the **machine-readable** source. **Both must agree.** If they diverge, this doc is the reference — reconcile the code.

Tokens to export:
- `color.*` (all palette entries from §7.2)
- `font.family.*`, `font.size.*`, `font.weight.*`, `font.leading.*` (§7.3)
- `space.*`, `radius.*` (§7.4)
- `motion.duration.*`, `motion.ease.*` (§7.7)
- `breakpoint.*`

---

## 17. How to Update This Document

This is a **living document**. The following rules keep it trustworthy:

1. **Any brand decision gets logged here first, then implemented in code.** If it's not in this doc, it's not a brand decision.
2. **Update the affected section AND the changelog in the same edit.** Never one without the other.
3. **Bump the doc version** using semver:
   - **Patch** (`0.1.0 → 0.1.1`) — clarification, typo, new example
   - **Minor** (`0.1.0 → 0.2.0`) — new section, new token, filled-in TBD
   - **Major** (`0.1.0 → 1.0.0`) — change that breaks existing code or collateral (palette shift, logo rev, name change)
4. **Update `Last updated`** at the top.
5. **Move resolved items out of §0 Open Questions** into their proper section.
6. **Keep markers honest**: if a section is still drafty, it stays ✏️ until someone explicitly locks it 🔒.
7. **If a decision is reversed**, the original decision stays in the changelog — do not rewrite history.

---

## 18. Changelog

All dates in `YYYY-MM-DD`.

### `0.2.0` — 2026-04-23

- 🔒 **Locked primary tagline: *"Just Ryo it."*** Restructured [§5.1](#51-tagline-) with locked primary + alternates table (11 secondaries approved for rotation) + collapsed retired-shortlist archive.
- 🔒 **Added [§7.0 Design ethos](#70-design-ethos-): *clean, minimal, luxurious.*** Establishes the three-question test and overrides any conflicting token-level decisions further down §7.
- ✏️ **Added new value [§2.3](#23-values-) #5: *Quiet luxury.***
- 🔒 **Resolved voice / playful tension in [§6.2](#62-tone-varies-by-context-).** New row for taglines + social + hero CTAs ("playful"), new precision row for trust / payments / legal ("never clever"), plus an explicit "where playful lives / where it doesn't" ruling. §6.2 moved from ✏️ to 🔒.
- **Presentation polish:** hero block + *"Just Ryo it."* lockup at the top, "At a Glance" summary card, full Table of Contents, legend converted to table form.
- §0 Open Questions pruned — resolved items moved into their sections.
- Version bumped **`0.1.3` → `0.2.0`** (minor — new locked sections, resolved TBDs, no breaking changes to code-facing tokens).

### `0.1.3` — 2026-04-23

- §5.1 Tagline brief pivoted to **playful, vibes-first, no-logic**. The previous logic-forward framing was over-serious for the brand personality the founder wants.
- New shortlist of 12 playful candidates. New current leader: **"Just Ryo it."**
- Prior shortlist (v0.1.2) preserved under "Retired shortlists" in §5.1.
- Note for future work: this pivot also implies a voice re-read in §6 — current voice rules still apply ("warm but precise, quiet expertise"), but product microcopy and social tone can lean more playful than the marketing-editorial tone. Open question to resolve in a future revision: how playful is too playful for the Ryo voice, and where is the line between hero copy and product copy.

### `0.1.2` — 2026-04-23

- §5.1 Tagline shortlist rewritten again. Added an explicit **brief** at the top of the section: the tagline must be short, philosophical, and universal — covering every trip type (work, vacation, staycation, friend trip, family, solo). The v0.1.1 *omotenashi*-focused list was too premium-leisure-coded for the real breadth of use cases.
- New shortlist of 8 candidates. New current leader: **"However you go."**
- Prior shortlists (v0.1.0 and v0.1.1) preserved under "Retired shortlists" in §5.1.

### `0.1.1` — 2026-04-23

- §5.1 Tagline shortlist rewritten. The v0.1.0 leader *"A home, far from home."* retired as cliché. New shortlist introduces eight candidates oriented around *omotenashi* (anticipation of guest needs). New current leader: **"You were expected."**
- Retired v0.1.0 candidates recorded in §5.1 so they are not accidentally revived.

### `0.1.0` — 2026-04-23

- Initial brand document.
- 🔒 Locked: brand name **Ryo**, name meaning and origin, positioning differentiators, voice principles, typography pairing (Fraunces + Inter + JetBrains Mono), accessibility baseline.
- ✏️ Drafted: mission / vision / values, audience personas, tagline shortlist, colour palette (hero accent still open), spacing scale, motion principles, dark-mode palette, domain list, localization plan.
- 🔲 Open: logo design, final hero accent, tagline selection, social handles, trademark filing, photography direction, email provider choice, `bnb → ryo` codebase migration.
