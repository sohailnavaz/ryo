/**
 * Ryo Help Center — FAQ content module.
 *
 * Pure, cross-platform TypeScript data. This file imports nothing and must stay
 * free of `next/*`, `react-native`, and DOM references so it can be consumed by
 * the web app, the mobile app, and shared feature screens alike.
 *
 * Brand voice: calm, warm, honest. We describe what Ryo does today and are
 * upfront about what is still rolling out — we don't over-promise.
 */

export type FaqItem = { q: string; a: string };

export type FaqCategory = {
  /** kebab-case slug, e.g. 'booking-a-stay' */
  id: string;
  /** human-readable category name, e.g. 'Booking a stay' */
  title: string;
  /** a single emoji */
  icon: string;
  /** one-line description of the category */
  blurb: string;
  items: FaqItem[];
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    icon: '👋',
    blurb: 'What Ryo is, how it works, and how to set up your account.',
    items: [
      {
        q: 'What is Ryo?',
        a: 'Ryo (旅, Japanese for "journey") is a short-term-stays app for booking homes and rooms anywhere your travels take you. It works the same on iOS, Android, and the web, so your trips, messages, and saved places follow you across every device. Our guiding idea is omotenashi — the sense that every guest is genuinely hosted, not just accommodated.',
      },
      {
        q: 'What makes Ryo different from other stay apps?',
        a: 'Four things we care about: vetted hosts, a 24/7 Concierge for help in your language, honest pricing with no surprise fees, and real guarantees if a stay does not match what was promised. The aim is for a stay to feel prepared just for you, rather than transactional. We would rather earn trust slowly than over-promise.',
      },
      {
        q: 'How do I create an account?',
        a: 'Tap Sign up and register with your email, or continue with a supported provider where it is available. You will set a password and can complete your profile — name, photo, and preferred language — at any time from Account. You only need an account to book, message a host, or save places; you can browse and search freely without one.',
      },
      {
        q: 'Is Ryo a phone app or a website?',
        a: 'Both, from one product. You can use Ryo in any modern web browser or install the iOS and Android apps for a smoother on-the-go experience, including your Offline pack for trips. Your account and bookings stay in sync wherever you sign in.',
      },
      {
        q: 'What is the Concierge?',
        a: 'The Concierge is Ryo\'s 24/7 assistant for questions before, during, and after a stay — from "what\'s the total price?" to "how do I reach my host?" It can help in multiple languages and hand off to a human support request when something needs a person. Look for the Concierge entry point in the app whenever you need a hand.',
      },
      {
        q: 'Do I have to pay to use Ryo?',
        a: 'Browsing, searching, saving places to Wishlists, and using the Concierge are free. You only pay when you book a stay, and the full price — including any fees — is shown before you confirm. There is no membership fee to be a guest.',
      },
      {
        q: 'How do I get help if I am stuck?',
        a: 'Start with the Concierge for instant answers in your language. If your question needs a person or relates to a specific stay, open Get help to raise a support request and our team will follow up. For anything urgent during a stay, the same flow routes you to faster help.',
      },
    ],
  },
  {
    id: 'booking-a-stay',
    title: 'Booking a stay',
    icon: '🧳',
    blurb: 'Searching, choosing dates and guests, and confirming a reservation.',
    items: [
      {
        q: 'How do I search for a place to stay?',
        a: 'Enter a destination, your dates, and the number of guests, then browse the results on the map or in the list. You can filter by price, home type, and amenities to narrow things down. Tap any listing to see photos, the full description, house rules, and reviews before you decide.',
      },
      {
        q: 'How do I set my dates and number of guests?',
        a: 'Pick your check-in and check-out dates on the calendar and set how many guests are coming, including any extra guests beyond the first. Availability and the total price update to match your selection. If a date is unavailable it will be blocked on the calendar, so what you see can be booked.',
      },
      {
        q: 'What does the total price include?',
        a: 'The price you see before you confirm is the full price for your dates — the nightly rate across your stay plus any applicable fees and taxes shown as line items. We do not spring hidden charges at the final step. If anything about the breakdown is unclear, ask the Concierge to walk you through it.',
      },
      {
        q: 'What is the difference between Instant Book and request to book?',
        a: 'With Instant Book you can confirm immediately without waiting for the host to approve. For request-to-book listings, you send a request and the host has a window to accept; you are only charged once they accept. Both are clearly labelled on the listing so you know what to expect.',
      },
      {
        q: 'How do I know my booking is confirmed?',
        a: 'Once a booking is confirmed it appears in Trips with the dates, address, and host details. You will also receive a confirmation notification. If a reservation does not show up in Trips shortly after booking, reach out through the Concierge or Get help so we can check on it.',
      },
      {
        q: 'Can I change the dates or guests on a booking?',
        a: 'You can request changes to a confirmed booking from Trips, subject to availability and the host\'s agreement; a price difference may apply. Some changes are still being rolled out, so if you do not see the option for your stay, message your host or use Get help and we will sort it out. Always confirm a change is accepted before you rely on it.',
      },
      {
        q: 'Can I book more than one place for the same trip?',
        a: 'Yes — many trips involve several stops, and each reservation is independent. Each confirmed stay appears separately in Trips with its own dates and details. Use Wishlists while you plan to keep candidate places for each leg in one spot.',
      },
      {
        q: 'What are Wishlists?',
        a: 'Wishlists let you save and group places you are considering — by trip, city, or vibe — so you can compare them later or share the idea with travel companions. Saving a place does not hold or book it; availability can change, so book once you are ready. You can keep as many Wishlists as you like.',
      },
    ],
  },
  {
    id: 'payments-and-pricing',
    title: 'Payments & pricing',
    icon: '💳',
    blurb: 'How pricing works, when you are charged, and getting receipts.',
    items: [
      {
        q: 'How does Ryo pricing work?',
        a: 'Pricing starts with the host\'s nightly rate, which can vary by season, weekend, or length of stay. On top of that you may see fees and taxes, all shown as line items before you confirm. The total you approve is the total you pay — no surprise add-ons at the end.',
      },
      {
        q: 'Are there hidden fees?',
        a: 'No. Honest pricing is a core promise: every fee that applies to your stay is itemised before you confirm, not revealed at the last step. If you ever see a charge you do not recognise, ask the Concierge or open Get help and we will explain it.',
      },
      {
        q: 'What currency and language will I see?',
        a: 'Ryo adapts to your locale, showing prices in your preferred currency and the app in your chosen language where supported. You can adjust your language and regional settings from Account. Exchange rates shown are for guidance; your bank or card may apply its own conversion.',
      },
      {
        q: 'When am I charged for a booking?',
        a: 'For Instant Book, payment is taken when you confirm. For request-to-book stays, you are only charged once the host accepts your request. Some hosts may offer split or later payment schedules where available, and the timing is shown before you confirm.',
      },
      {
        q: 'Which payment methods can I use?',
        a: 'Ryo is expanding its payment options, and the methods available to you appear at checkout based on your region. We are honest that some live payment flows are still being rolled out, so a few options may not be active everywhere yet. If your preferred method is missing, the Concierge can tell you what is supported in your area.',
      },
      {
        q: 'Where do I find my receipt?',
        a: 'A price breakdown is available with each reservation in Trips, and a receipt is issued for confirmed, paid bookings. If you need a formal invoice or a copy for expenses, open Get help with the booking details and we will provide one. Keeping your email up to date in Account ensures receipts reach you.',
      },
      {
        q: 'Why might the price change between viewing and booking?',
        a: 'Nightly rates can shift with demand, dates, or how long you stay, and a listing\'s availability can change while you browse. The price is locked once you confirm, so the figure you approve is what you pay. If you notice a difference, re-check your dates and guest count, which affect the total.',
      },
    ],
  },
  {
    id: 'cancellations-and-refunds',
    title: 'Cancellations & refunds',
    icon: '↩️',
    blurb: 'Cancellation policies, refunds, and what the guarantee covers.',
    items: [
      {
        q: 'How do cancellation policies work?',
        a: 'Each listing shows its cancellation policy before you book, ranging from flexible to stricter terms set by the host. The policy determines how much you get back depending on how far ahead you cancel. Read it on the listing so there are no surprises later.',
      },
      {
        q: 'How do I cancel a booking?',
        a: 'Open the reservation in Trips and choose to cancel; you will see the refund you are eligible for under that listing\'s policy before you confirm. If the cancel option is not yet available for your stay, use Get help and our team will process it. We will always show the refund amount before anything is final.',
      },
      {
        q: 'How long do refunds take?',
        a: 'Once a cancellation is confirmed, the eligible refund is initiated to your original payment method. The time to appear depends on your bank or provider, typically a few business days. Because some payment flows are still rolling out, timing can vary by region — the Concierge or Get help can check the status of a specific refund.',
      },
      {
        q: 'What happens if my host cancels on me?',
        a: 'If a host cancels a confirmed booking, you receive a full refund for that stay, and we will help you find a comparable place where we can. Host cancellations are taken seriously because they disrupt your plans. Reach out through Get help and the team will support you through rebooking.',
      },
      {
        q: 'What is the Ryo guarantee?',
        a: 'If a place is seriously not as described — or you cannot get in and the host is unreachable — our guarantee is there to make it right, whether that means a comparable rebooking or a refund. The fastest path is to report it through Get help while you are at the stay so we can act quickly. We would rather fix a problem than leave you stranded.',
      },
      {
        q: 'Can I get a refund if I cut my trip short?',
        a: 'Refunds for leaving early depend on the listing\'s cancellation policy and the circumstances. If you are cutting short because something is genuinely wrong with the stay, report it through Get help right away so it can be assessed under the guarantee. For a change of plans, the host\'s policy applies.',
      },
      {
        q: 'Will I be charged a fee to cancel?',
        a: 'Cancelling itself does not carry a separate Ryo penalty fee; what you get back is governed by the listing\'s cancellation policy. Some non-refundable portions may apply depending on timing and the policy you agreed to. The exact refund is always shown before you confirm the cancellation.',
      },
    ],
  },
  {
    id: 'during-your-stay',
    title: 'During your stay',
    icon: '🏡',
    blurb: 'Check-in, contacting your host, the Concierge, and getting help.',
    items: [
      {
        q: 'How does check-in and check-out work?',
        a: 'Your host shares check-in details — times, directions, and how to get the keys or access code — which you can find with the reservation in Trips. Honour the listed check-in and check-out times unless you have agreed otherwise with your host. If anything about access is unclear, message your host ahead of arrival.',
      },
      {
        q: 'Where do I find the house rules?',
        a: 'House rules are listed on the listing and travel with your reservation in Trips, covering things like quiet hours, guests, pets, and smoking. Following them keeps the stay smooth and helps your review. If a rule is unclear, ask your host or the Concierge before you book.',
      },
      {
        q: 'How do I contact my host?',
        a: 'Use secure in-app messaging from your reservation in Trips to reach your host directly. Keeping conversations in the app means your messages are documented if you ever need support to step in. For quick general questions, the Concierge can often help instantly while you wait on your host.',
      },
      {
        q: 'What is the Offline pack?',
        a: 'The Offline pack saves the essentials for your stay — address, check-in details, host contact, and key info — so you can reach them even without a signal. It is handy when you land somewhere with no data or patchy Wi-Fi. Download it before you travel from your trip in the app.',
      },
      {
        q: 'What is the Phrasebook?',
        a: 'The Phrasebook gives you handy local phrases for your destination so you can greet a host, ask for directions, or handle everyday moments with a little more ease. It pairs well with the Concierge, which can also help in your language. Think of it as a small kindness for travelling somewhere new.',
      },
      {
        q: 'Something is wrong with my stay — what do I do?',
        a: 'First, message your host through Trips, since many issues are resolved quickly that way. If it is urgent or the host is unreachable, open Get help to raise a support request and, where it qualifies, the guarantee applies. Reporting while you are still at the stay helps us act fastest.',
      },
      {
        q: 'How do I report an incident or a problem?',
        a: 'Use Get help to file a support request describing what happened, ideally with photos and the booking details. This creates a tracked case so the team can follow up and, where needed, apply the guarantee. The sooner you report, the more we can do.',
      },
      {
        q: 'What should I do in an emergency?',
        a: 'If anyone is in danger or there is a fire, medical, or safety emergency, contact your local emergency services first — Ryo cannot replace them. Once everyone is safe, open Get help so we can support you and address anything related to the stay. Your Offline pack keeps the address and host contact handy if you need them.',
      },
    ],
  },
  {
    id: 'trust-and-safety',
    title: 'Trust & safety',
    icon: '🛡️',
    blurb: 'Verified hosts, secure messaging, reviews, and reporting problems.',
    items: [
      {
        q: 'How are hosts vetted?',
        a: 'Vetted hosts are a core part of Ryo, with checks designed to build confidence before you book. Listings carry reviews from real past guests so you can see how previous stays went. If something about a host or listing feels off, you can report it through Get help.',
      },
      {
        q: 'Is my communication with hosts secure?',
        a: 'Yes — message your host through Ryo\'s in-app messaging rather than moving off-platform. Keeping it in the app means conversations are documented if you ever need support to help, and it protects you from off-platform scams. Be cautious of anyone asking you to pay or talk outside Ryo.',
      },
      {
        q: 'Are payments handled securely?',
        a: 'Payments are processed through Ryo so you never have to hand card details to a host directly. Always pay within the app — a request to pay outside Ryo is a red flag and is not covered by our protections. Some live payment flows are still rolling out, but the principle of keeping payments in-app holds throughout.',
      },
      {
        q: 'How do reviews work?',
        a: 'After a stay, both guests and hosts can leave honest reviews, which helps the whole community make better choices. Reviews are tied to real, completed bookings to keep them trustworthy. Read them on any listing to get a candid sense of a place before you book.',
      },
      {
        q: 'How is my personal data protected?',
        a: 'We collect what is needed to run your bookings and keep stays safe, and we aim to handle your information transparently. Your host sees only what they need to host you — not your full personal details. You can review and update your information from Account, and ask about your data rights through Get help.',
      },
      {
        q: 'How do I report a listing, host, or guest?',
        a: 'Use Get help to report anything that seems unsafe, dishonest, or against the rules — a misleading listing, a concerning message, or behaviour during a stay. Include details and any evidence so the team can review it. Reports are taken seriously and handled by our team.',
      },
      {
        q: 'What should I watch out for to stay safe?',
        a: 'Keep messaging and payments inside Ryo, be wary of deals that pressure you off-platform, and read reviews before booking. If a host asks you to wire money, pay by gift card, or communicate only off-app, treat it as a warning sign and tell us through Get help. When in doubt, the Concierge can help you sanity-check a situation.',
      },
    ],
  },
  {
    id: 'hosting-on-ryo',
    title: 'Hosting on Ryo',
    icon: '🔑',
    blurb: 'Listing your home, managing availability, payouts, and reviews.',
    items: [
      {
        q: 'How do I list my home on Ryo?',
        a: 'From the host area you can create a listing with photos, a description, amenities, house rules, and your nightly price. Clear photos and an honest description set the right expectations and earn better reviews. You can save progress and refine the listing before you publish it.',
      },
      {
        q: 'How do I manage my availability?',
        a: 'Your host calendar is where you open or block dates and keep availability accurate so guests only book nights you can host. Keeping it current avoids declines and last-minute clashes. Block dates you need for yourself and reopen them whenever plans change.',
      },
      {
        q: 'How should I price my home?',
        a: 'Set a nightly rate that reflects your space, location, and season, and look at comparable nearby listings for a sense of the market. Honest, fair pricing — with no hidden extras — tends to win trust and repeat guests. You can adjust your rate over time as you learn what works.',
      },
      {
        q: 'How and when do I get paid?',
        a: 'Host payouts are sent to you for completed stays through the payouts setup in the host area. Exact timing and available payout methods depend on your region, and we are honest that some payout flows are still being rolled out. If you have questions about a specific payout, use Get help.',
      },
      {
        q: 'What are my responsibilities as a host?',
        a: 'Keep your listing accurate, your calendar up to date, and your home clean, safe, and ready for check-in as described. Respond to guests promptly through in-app messaging and honour the house rules and policies you set. Good hosting is the heart of omotenashi — guests remember feeling genuinely welcomed.',
      },
      {
        q: 'How do guest reviews affect me?',
        a: 'After each stay, guests can leave an honest review, and your track record helps future guests choose your place with confidence. Responding gracefully to feedback — and fixing real issues — builds a strong reputation over time. Reviews are tied to completed bookings to keep them fair.',
      },
      {
        q: 'Can I message guests before they arrive?',
        a: 'Yes — use secure in-app messaging to share check-in details, answer questions, and make guests feel expected. Keeping it in the app documents the conversation in case support is ever needed. A warm, clear message before arrival sets the tone for the whole stay.',
      },
    ],
  },
  {
    id: 'account-and-privacy',
    title: 'Account & privacy',
    icon: '⚙️',
    blurb: 'Your profile, language, notifications, and data rights.',
    items: [
      {
        q: 'How do I update my profile?',
        a: 'Open Account to edit your name, photo, contact email, and other profile details. A complete profile helps hosts welcome you and builds trust on both sides. Keeping your email current also ensures booking confirmations and receipts reach you.',
      },
      {
        q: 'How do I change my language or region?',
        a: 'Set your preferred language and locale in Account, and Ryo will adapt the app and pricing where supported. The Concierge can also help in multiple languages, and the Phrasebook supports you on the ground. If a language you need is not yet available, let us know through Get help.',
      },
      {
        q: 'How do I manage notifications?',
        a: 'Adjust which updates you receive — booking confirmations, messages, and reminders — from your notification settings in Account. We aim to send what is useful for your trips without clutter. On mobile, you can also manage permissions in your device settings.',
      },
      {
        q: 'How do I reset my password?',
        a: 'On the sign-in screen, choose Forgot password and follow the email link to set a new one. If you signed up with a provider, sign in the same way you originally did. If you are locked out or do not receive the email, open Get help and we will assist.',
      },
      {
        q: 'What are my data and privacy rights?',
        a: 'We aim to handle your information transparently and collect what is needed to run your bookings and keep stays safe. You can review and update much of your data from Account, and request access or corrections through Get help. Hosts only see the details needed to host you, not your full personal information.',
      },
      {
        q: 'How do I delete my account?',
        a: 'You can request account deletion through Account or by contacting us via Get help. We will guide you through it and explain what happens to your data and any active bookings, since some records may be retained where required. If you have upcoming trips, settle or cancel those first so nothing is left open.',
      },
      {
        q: 'Is my payment information safe?',
        a: 'Payments are processed securely through Ryo, and we keep your card details out of hosts\' hands. Always pay within the app and never share full card numbers in messages. As live payment flows continue to roll out, this in-app, secure-by-default approach stays the same.',
      },
    ],
  },
];

/**
 * Case-insensitive substring search across the question + answer text of every
 * FAQ item, returning flattened matches alongside their category title.
 */
export type FaqHit = { category: string; q: string; a: string };

export function searchFaq(query: string): FaqHit[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];

  const hits: FaqHit[] = [];
  for (const category of FAQ_CATEGORIES) {
    for (const item of category.items) {
      const haystack = (item.q + ' ' + item.a).toLowerCase();
      if (haystack.includes(needle)) {
        hits.push({ category: category.title, q: item.q, a: item.a });
      }
    }
  }
  return hits;
}
