---
doc: PARTNER_OVERVIEW
purpose: Plain-language walkthrough of Ryo for a non-technical partner. What it is, how the app works screen by screen, and what's built. Safe to forward.
last_updated: 2026-05-22
version: 1.1.0
---

# Ryo — A Partner's Walkthrough

> ### *Just Ryo it.*
> Short-term stays where guests are **hosted**, not just accommodated.

*This document is written for a non-technical reader. No coding knowledge needed. It explains what we're building, how a person actually uses the app, and what already exists today.*

| | |
|---|---|
| **What it is** | A short-term-rental app (think Airbnb), rebuilt around hospitality and trust |
| **Name** | **Ryo** — from the Japanese word for *journey* (旅) |
| **Promise** | Every stay feels prepared for you — vetted hosts, 24/7 concierge, honest pricing |
| **Stage** | Version 1 in build. Real listings live; payments still in "demo" mode |

---

## 1. The big idea (in one minute)

Airbnb made home-sharing huge — but along the way it became impersonal. Surprise
fees at checkout. Slow support when something goes wrong. Hosts you can't really
trust. A lot of travellers now quietly think *"why didn't I just book a hotel?"*

**Ryo fixes that.** Same convenience as Airbnb, but built around three things people
actually want:

1. **Trust** — every host is verified; the best homes are personally inspected.
2. **Service** — a real human concierge available 24/7, in the guest's own language.
3. **Honesty** — the price you see is the price you pay. No hidden fees, no pressure tactics.

That's the whole pitch: *the convenience of Airbnb, the care of a good hotel.*

---

## 2. The three kinds of people who use Ryo

Think of the app as **three connected experiences**, one for each type of user:

| Who | What they do | Where they are in the app |
|---|---|---|
| 🧳 **Guests** | Search, book, and stay | The main app (phone + website) |
| 🏠 **Hosts** | List their homes, manage bookings, get paid | The "Host" area |
| 🛠️ **Our team (Admin)** | Keep the platform safe, handle issues, oversee money | The internal "Admin" area |

All three share the same look and the same underlying system — they're just
different doors into it. The rest of this document walks through each one.

---

## 3. The Guest journey — step by step

This is the heart of the product. Here's exactly what a traveller experiences,
in order.

### Step 1 — Arrive & explore
The guest opens Ryo and lands on the **home screen**: a clean grid of beautiful
homes, photos first. Across the top is a row of **categories** (beachfront,
cabins, city apartments, and so on) and a **search bar**. They can browse freely
without signing in.

### Step 2 — Search & filter
The guest types where they want to go and the dates. They can narrow things down
with **filters** — price, number of guests, amenities (pool, wifi, kitchen),
property type. A **map view** shows where each home sits.

### Step 3 — Look at a home
Tapping a home opens the **listing page**: a full photo gallery, the description,
the list of amenities, house rules, reviews from past guests, and the host's
profile. A **booking card** stays visible showing the nightly price and total.

### Step 4 — Book the stay
The guest picks their dates on a **calendar**, sees the **full price broken down**
(nightly rate, service fee, total — nothing hidden), and confirms. *Today this
uses a demo payment step — the booking is created for real, but no money moves
yet. Real payments are the next major milestone.*

### Step 5 — Manage the trip
Once booked, the stay appears under **Trips**. The guest can view the details,
see the address and check-in info, and **cancel** if their plans change.

### Step 6 — Their personal hub
Every guest has an **Account** area — a personal dashboard showing upcoming and
past trips, saved favourites, messages, and profile settings (name, language,
currency). They can also keep a **Wishlist** of homes they love but haven't
booked yet.

> **In short:** Browse → Search → View a home → Book → Manage the trip → Personal hub.
> Exactly the flow people already know from Airbnb, but calmer and more honest at every step.

---

## 4. The Host experience

Hosts get their own dedicated area to run their business. It's designed to feel
like a proper, professional dashboard. Here's what a host can do:

- **Dashboard** — a glance at everything: upcoming check-ins, this month's earnings, rating, occupancy.
- **Create a listing** — add a new home with photos, description, amenities, pricing, and rules. *(This is live and saves real data.)*
- **My Listings** — see and edit all their homes in one place.
- **Calendar** — a colour-coded view of which dates are available, booked, or blocked.
- **Bookings** — every reservation, with details and a clear payout breakdown.
- **Earnings** — what they've made this month, last month, and year-to-date, plus the payout queue.
- **Inbox** — messages with guests, thread by thread.
- **Reviews** — their ratings over time.
- **Settings** — profile, payout details, taxes, and co-host team.

> Some of the host screens currently show realistic *sample* data so we can
> demonstrate the full experience before the live plumbing is finished. The
> create-listing and my-listings flows already save and load real data.

---

## 5. The Admin (our team) experience

Behind the scenes, our own team needs tools to keep Ryo safe, fair, and running.
The Admin area covers:

- **Overview** — the health of the whole platform at a glance.
- **Users & Bookings** — search anyone, inspect any reservation, take action when needed.
- **Moderation** — review listings and flagged content before they cause problems.
- **Incidents** — handle anything that goes wrong during a stay.
- **Finance** — track total sales, reconcile payments, manage payouts and refunds.
- **Audit log** — a permanent record of who did what, for accountability.
- **System health & feature flags** — monitor the platform and switch features on or off safely.

This is what makes the "service guarantee" and "trust" promises real — there's a
team and a toolset standing behind every booking.

---

## 6. What's actually built today (honest status)

We believe in being straight about what exists versus what's planned.

| Area | Status |
|---|---|
| ✅ The full app design & look | Done — clean, warm, consistent across phone and web |
| ✅ Browsing, search, filters, map | Built |
| ✅ Listing pages | Built |
| ✅ Booking flow | Built (with **demo** payment for now) |
| ✅ Trips, Favourites, Account hub | Built & connected to the real database |
| ✅ Host: create & manage listings | **Live** — saves real data |
| ✅ Host dashboard, calendar, earnings, inbox | Built (some with sample data for demo) |
| ✅ Admin tools | Built (preview, with sample data) |
| ✅ Real database with 20 starter homes | **Live** |
| 🔜 Real payments & host payouts | Next major milestone |
| 🔜 24/7 concierge tooling | Planned for v2 |
| 🔜 Public live website link | Coming once payments are wired |

**Plain-English summary:** The app looks and feels finished and you can walk
through almost the entire guest and host journey. The two big things still to come
are *real money movement* (payments and payouts) and the *live concierge service* —
both planned and scoped, not yet switched on.

---

## 7. How it all fits together (the simple version)

You don't need the technical details, but here's the shape of it in everyday terms:

- **One app, two faces.** The same product runs as a **phone app** (iPhone/Android) *and* a **website**. We build each screen once and it works on both — that saves time and keeps everything consistent.
- **A shared "engine room."** All the data — homes, bookings, users, reviews — lives in one secure, reliable database (a trusted service called Supabase, the same kind of technology that powers many modern apps). Both the phone app and the website talk to this single source, so everyone always sees the same up-to-date information.
- **Security built in.** The system enforces who's allowed to see and do what — a guest can't see another guest's trips, a host only manages their own homes. This is built into the foundation, not bolted on later.

Think of it like a restaurant: the **menu and dining room** (the app screens) are
what guests see, the **kitchen** (the database) is shared and central, and the
**staff rules** (security) make sure the right people handle the right things.

---

## 8. The look & feel (the brand)

Ryo is designed to feel **calm, warm, and a little luxurious** — the opposite of a
cluttered booking site. A few deliberate choices:

- **Warm cream backgrounds**, never harsh white.
- **Terracotta** (a warm clay-orange, `#C87156`) reserved for the important
  buttons — used sparingly so it always feels special.
- **Elegant editorial type** for headlines, clean readable type for everything else.
- **Honest design** — no fake "only 1 room left!" pressure, no hidden fees, large
  easy-to-tap buttons, works in many languages from day one.

The name **Ryo** (旅, "journey") and our service philosophy come from the Japanese
idea of *omotenashi* — anticipating a guest's needs before they even ask. That
spirit guides every design and product decision.

---

## 9. The plan — from "built" to "launched" to "growing"

Having the app built is the *starting line*, not the finish. Here's the plan for
what happens next, in four clear stages. Think of it as turning a finished
showroom car into a car that's actually on the road carrying passengers.

### Stage 1 — Switch on the real engine *(a few weeks)*
Right now the app *looks* finished and you can click through almost everything,
but a few core systems are still in "demo" mode. This stage turns them on:

- **Real accounts & sign-in** — proper email/Google login that works for anyone, anywhere.
- **Real money** — connect payment providers (Stripe + Razorpay for India) so guests can actually pay and hosts actually get paid. Money is held safely until 24 hours after check-in (this is what lets us *guarantee* the stay).
- **Real emails** — booking confirmations, receipts, and notifications sent to people's inboxes.
- **A web address** — secure the domain names (e.g. ryostays.com) and put the site live on the internet, so it's not just on a developer's computer.
- **The legal basics** — Terms of Service, Privacy Policy, cookie consent.

> *A few of these need you (or the business side) to act in parallel:* register
> the domains, open Apple/Google developer accounts (to publish the phone apps),
> and pick an email provider. These are quick but have waiting periods, so
> starting them early keeps the timeline tight.

### Stage 2 — Make every button truly work *(several weeks)*
The host and admin areas currently *show* information beautifully but don't yet
*perform* every action. This stage wires them up for real:

- **Hosts** can fully manage calendars, accept/decline bookings, set up payouts, reply to reviews, and message guests.
- **Our team** can suspend bad actors, approve or reject listings, issue refunds, and resolve incidents — every action recorded for accountability.
- **Guests** get the finishing touches: write reviews after a stay, message hosts before booking, named wishlists, full trip details with check-in instructions.

### Stage 3 — Polish, safety & go to the App Stores *(a few weeks, overlaps Stage 2)*
Before inviting the public, we make it trustworthy and discoverable:

- **Multiple languages & currencies** properly switched on (built in from day one — just needs activating).
- **Safety & support** — a real "report a problem" path and our published service promise (*answer within 2 minutes on chat*).
- **Reliability** — monitoring so we know instantly if something breaks, plus speed and security tuning.
- **Phone apps published** to the Apple App Store and Google Play (these have a ~2-week review wait, so we start early).

### Stage 4 — Launch & grow *(ongoing)*
Now we open the doors — deliberately, not all at once:

1. **Soft launch** — invite a small group (friends, family, a handful of curated hosts) to a private version. Catch problems while the audience is small and forgiving.
2. **Curated launch in India + Southeast Asia** — hand-pick ~200–500 excellent homes. Quality from day one; we'd rather have 300 great stays than 30,000 random ones. *This curation is our advantage — it's the one thing the big players can't copy without hurting their own brand.*
3. **Turn on the concierge** — the 24/7 multilingual human support that is the heart of Ryo's promise. Service quality *becomes* our marketing.
4. **Grow on proof** — only after guests start re-booking (the real signal that they loved it) do we spend on advertising and open up to more hosts and nearby countries.

### A realistic timeline
With a small team, getting from "built" to "publicly launched" is roughly
**7–9 weeks of focused work**, including the unavoidable waits (App Store review,
domain setup, legal). With more hands it can compress to **4–5 weeks**. Stage 4
(growth) then continues for as long as the business runs.

> **The honest headline:** the hard, expensive part — designing and building the
> whole app — is largely *done*. What remains is mostly *connecting* it to live
> systems and *opening it carefully*. That's a much faster, lower-risk phase than
> what's already behind us.

---

## 10. Where we'd value your input

A few open decisions where a partner's perspective genuinely helps:

1. **Demo vs. real payments for launch** — do we ship sooner with the current
   flow, or wait until real payments are in? (Trade-off: speed vs. the
   "full-service" promise.)
2. **First launch markets** — we're leaning toward India + Southeast Asia, while
   building to work globally. Right focus?
3. **Brand feel** — does *"Just Ryo it."* and the calm/warm/premium direction land
   for you?

---

*This is a living document — it's updated as the product moves forward. For the
detailed status, see [PROGRESS.md](./PROGRESS.md); for the business model, see
[BUSINESS_MODEL.md](./BUSINESS_MODEL.md).*
