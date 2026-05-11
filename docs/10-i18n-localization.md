# 10 · i18n & Localization

> Every language, every currency, every region. Native-feeling from day one.

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Module ID     | `10-i18n-localization`                                                                     |
| Status        | ✏️ Draft                                                                                   |
| v1 scope      | Scaffolding + 2–3 launch locales (en, hi, es). RTL plumbing ready. Full rollout phased.    |
| Owner         | TBD                                                                                        |
| Linked        | Every module                                                                               |
| Last updated  | 2026-04-24                                                                                 |

---

## 1. Purpose & Ryo alignment

The founder's brief was explicit: **"all language change"**. Ryo is global from day one. This module owns the mechanics of making every user-visible string, every date/number/currency, every email and SMS, every map and address feel native — not translated.

The brand principle from [branding §9](./branding.md#9-localization--brand-adaptation): *translate meaning, not words.*

---

## 2. Principles 🔒

1. **No user-visible string in code.** Every string goes through i18n keys. No hard-coded English.
2. **ICU MessageFormat** for plurals, genders, selects, and interpolation. No ad-hoc templating.
3. **Locale, not language.** `en-IN` ≠ `en-GB` ≠ `en-US`. Currency, date, spelling all shift.
4. **RTL as a first-class layout direction.** Not a retrofit. Arabic, Hebrew, Urdu render correctly from v1 shell.
5. **Translator-friendly.** Keys have context descriptions. Strings have max-length hints. Translators get screenshots where UI matters.
6. **Critical surfaces show original + translated.** Addresses, gate codes, legal terms, payment amounts — never trust translation alone.
7. **No auto-translate for UI strings.** Machine translation is for user-generated content (messages, reviews, host descriptions). UI is human-translated and reviewed.

---

## 3. Locale plan

### v1
| Locale   | Language | Region  | Currency default | Notes                                           |
| -------- | -------- | ------- | ---------------- | ----------------------------------------------- |
| `en-IN`  | English  | India   | INR              | Primary launch locale                           |
| `hi-IN`  | Hindi    | India   | INR              | Devanagari; formal + warm tone                  |
| `en-US`  | English  | US      | USD              | Global default fallback                         |
| `es-ES`  | Spanish  | Spain   | EUR              | Test international rollout                      |

### v2
Add: `fr-FR`, `de-DE`, `ar-AE` (RTL), `ja-JP`, `pt-BR`, `id-ID`, `th-TH`, `zh-Hans`.

### Fallback chain
`requested locale → same language other region → en-US`.

Example: user requests `en-GB` and a string isn't translated → falls through to `en-US`.

---

## 4. What gets localised

| Thing                     | How                                                                |
| ------------------------- | ------------------------------------------------------------------ |
| UI strings                | ICU messages keyed in source                                       |
| Dates & times             | `Intl.DateTimeFormat` or equivalent                                |
| Numbers                   | `Intl.NumberFormat`                                                |
| Currencies                | `Intl.NumberFormat({style:'currency', currency})`                  |
| Units                     | km vs miles, °C vs °F, 24h vs 12h — per locale default             |
| Email templates           | Locale-aware (see [§09](./09-notifications-mail.md))                |
| SMS templates             | Locale-aware                                                       |
| Legal / T&C / Privacy     | Per-jurisdiction translations reviewed by counsel                  |
| Host listing descriptions | Host writes in original; system offers machine translation for guests |
| Messages                  | Machine translation on the fly ([§07](./07-messaging.md))           |
| Reviews                   | Machine translation with "see original" toggle                     |
| Currency conversion       | Display only; booking charge pinned per [§06](./06-payments-payouts.md) |
| Address formats           | Country-specific templates (India, US, Japan, UK…)                 |
| Phone inputs              | `libphonenumber` with country selector                             |

---

## 5. Routing

### Web (Next.js App Router)
- Route segment: `/[locale]/…` — `/en/search`, `/hi/search`.
- Locale detected from: URL → cookie → `Accept-Language` header → default.
- `next-intl` or `next-i18next` for string loading (TBD — `next-intl` preferred for App Router).

### Mobile (Expo Router)
- Detect via `expo-localization`.
- Manual override in settings.
- Same key catalogue as web.

---

## 6. RTL support

- Layout direction driven by locale metadata.
- Tailwind `rtl:` variants used intentionally; avoid physical sides (`left`/`right`), prefer logical (`start`/`end`).
- Icons that imply direction (back arrow, carousel) flip in RTL.
- Text inputs, number inputs, sliders tested in RTL before ship.
- Product screenshots audit pre-launch for flip correctness.

---

## 7. Tooling

### Source of truth
- Catalogues live in `packages/config/i18n/{locale}.json`.
- Default locale `en-US` is the authoring locale; other locales derive.
- Keys use dot-notation (`listing.detail.price.total`).

### Translation management
- **Platform**: Lokalise or Crowdin (TBD — Lokalise preferred for ICU + screenshots).
- CI export/import keeps code and platform in sync.
- Translators see key + English source + context + max-length + screenshot.

### QA
- Pseudo-locale (e.g. `en-XA`) for UI-layout testing (expanded strings, accented chars).
- Lint rule: no string literal in JSX/RN props (enforced).
- Every PR that adds strings flags them in review.

---

## 8. Currency

- Listings priced in **host currency**. Stored, never converted.
- Guest sees prices in **preferred currency** — converted at display for UI; **pinned** at booking quote ([§06](./06-payments-payouts.md)).
- FX rate source: one trusted provider (e.g. OpenExchangeRates) cached hourly.
- Currency selection persists in profile; changeable in header/footer.

---

## 9. Data model

### `public.locales`
Reference table — active locales, defaults (currency, date format, first-day-of-week, direction).

### `public.profiles.preferred_locale`, `profiles.preferred_currency`
See [§02](./02-auth-identity.md).

### `public.translations_cache`
User-generated content machine translations cached per `(content_type, content_id, locale)` to avoid re-billing per view.

### `public.fx_rates`
Hourly snapshot keyed on `(base, quote, captured_at)`.

---

## 10. API surface

- `GET /i18n/:locale/:namespace.json` — catalogue loader (CDN-cached).
- `POST /translate` — server-side UGC translation (auth-gated, cached).
- `GET /fx?base=&quote=` — live rate.

---

## 11. Edge cases & failure modes

- **Missing translation for a key.** Fall back per §3 chain. In dev, loudly warn. In prod, serve fallback silently.
- **Partial locale ship.** Mark incomplete locales as "beta" in the switcher so expectations are set.
- **RTL with embedded LTR content** (e.g. English brand name in Arabic sentence). Use bidi isolation markers.
- **Plural rules differ wildly** (Arabic has 6 plural forms). ICU handles it; translators must be briefed.
- **Currency display in host's currency** when guest forgot to set preference — use `Accept-Language` guess + clear "change currency" affordance.
- **Legal content mistranslated** — counsel review mandatory before publish; never auto-translate T&C.
- **User changes locale mid-session.** Full re-render + refetch localisable server content; don't mix locales on one page.
- **Email arrives in wrong language.** Locale sniff at send-time from `profiles.preferred_locale`; if missing, use `Accept-Language` history.

---

## 12. KPIs

- **Locale coverage**: share of users served in their preferred locale.
- **Translation-freshness lag**: days between string add and translation ship.
- **Missing-key rate** in prod (target 0 for critical surfaces).
- **UGC-translation cache hit rate** (cost control).
- **Non-English conversion rate** parity with English.

---

## 13. Dependencies

- **Every module.** i18n is cross-cutting.
- **Translation vendor** (Lokalise / Crowdin).
- **MT provider** (DeepL / Google Translate) for UGC.
- **FX provider** (OpenExchangeRates or similar).

---

## 14. v1 scope

- ✅ Catalogue infra + `next-intl` + Expo localisation wired.
- ✅ Pseudo-locale for layout QA.
- ✅ 3 locales shipped (`en-IN`, `en-US`, `hi-IN` at minimum).
- ✅ Date/number/currency formatting via `Intl.*`.
- ✅ RTL plumbing ready (even if no RTL locale in v1).
- ✅ Locale switcher in footer.
- 🔲 Full MT for UGC — **v2** (messaging is v2).
- 🔲 Legal content translated per jurisdiction — **v2**.

---

## 15. Open questions

- 🔲 Translation vendor pick (Lokalise vs Crowdin).
- 🔲 MT vendor pick (DeepL for EU quality, Google for coverage).
- 🔲 FX margin policy (transparent markup vs. mid-market zero-cost) — see [§06](./06-payments-payouts.md).
- 🔲 How do we handle Arabic numerals vs Eastern Arabic numerals in `ar-*`? Default Western.
- 🔲 Do we support Hinglish / transliteration-first Indian-language inputs? Interesting UX question.
- 🔲 Per-host-language tagging (host speaks: Hindi, English) — surface in listing search?
