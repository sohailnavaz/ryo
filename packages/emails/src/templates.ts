// The transactional email drafts. Each is a pure function of its data → EmailDoc
// (subject + branded HTML + plain-text fallback). No provider coupling — send.ts
// delivers whatever these return.
//
// Money is passed already-formatted (e.g. "₹6,188") so this package stays currency-
// agnostic. Auth templates (magic link, password reset) use Supabase's {{ .Var }}
// placeholders so the SAME markup can be pasted into supabase/templates/ (see
// supabase/templates/*.html) — Supabase substitutes them server-side.

import {
  brand,
  button,
  divider,
  EmailDoc,
  h1,
  p,
  row,
  strongInk,
  wrapEmail,
} from './layout';

const APP = 'https://ryo-web.vercel.app';

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function welcome(d: { name: string }): EmailDoc {
  const first = d.name.split(' ')[0] || 'there';
  const body =
    h1(`Welcome to Ryo, ${first}.`) +
    p(`You’re in. Ryo is short-term stays where you’re <em>hosted</em>, not just booked — vetted homes, a 24/7 concierge, and honest all-in pricing.`) +
    p(`Tell us where you’re dreaming of and we’ll find a place that feels prepared just for you.`) +
    button('Find your first stay', APP) +
    divider() +
    p(`Questions any time of day? Our concierge answers in your language.`);
  return {
    subject: 'Welcome to Ryo — you’re hosted now',
    html: wrapEmail({ title: 'Welcome to Ryo', preheader: 'Vetted homes, a 24/7 concierge, honest pricing.', bodyHtml: body }),
    text: `Welcome to Ryo, ${first}.\n\nYou're in — vetted homes, a 24/7 concierge, and honest all-in pricing.\nFind your first stay: ${APP}\n\nJust Ryo it.`,
  };
}

export function bookingConfirmation(d: {
  guestName: string;
  listingTitle: string;
  city: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  total: string;
  bookingUrl: string;
}): EmailDoc {
  const body =
    h1('Your stay is confirmed.') +
    p(`${d.guestName.split(' ')[0]}, you’re all set for ${strongInk(d.listingTitle)} in ${d.city}.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;">
       ${row('Check-in', d.checkIn)}
       ${row('Check-out', d.checkOut)}
       ${row('Nights', String(d.nights))}
       ${row('Guests', d.guests)}
       <tr><td colspan="2" style="padding:6px 0;"><div style="height:1px;background:${brand.border};"></div></td></tr>
       ${row('Total paid', d.total, { strong: true, big: true })}
     </table>` +
    button('View your trip', d.bookingUrl) +
    divider() +
    p(`Your Offline Stay Pack (directions, door codes, local emergency numbers) will be ready in the app before check-in. Safe travels.`);
  return {
    subject: `Confirmed — ${d.listingTitle}, ${d.checkIn}`,
    html: wrapEmail({ title: 'Booking confirmed', preheader: `${d.listingTitle}, ${d.city} · ${d.checkIn} → ${d.checkOut}`, bodyHtml: body }),
    text: `Your stay is confirmed.\n\n${d.listingTitle}, ${d.city}\nCheck-in ${d.checkIn} · Check-out ${d.checkOut} · ${d.nights} nights · ${d.guests}\nTotal paid: ${d.total}\n\nView your trip: ${d.bookingUrl}`,
  };
}

export function paymentReceipt(d: {
  guestName: string;
  listingTitle: string;
  receiptNo: string;
  paidOn: string;
  method: string;
  subtotal: string;
  cleaningFee: string;
  serviceFee: string;
  taxes: string;
  total: string;
  bookingUrl: string;
}): EmailDoc {
  const body =
    h1('Receipt for your stay') +
    p(`Thanks, ${d.guestName.split(' ')[0]}. Here’s your receipt for ${strongInk(d.listingTitle)}.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;">
       ${row('Receipt no.', d.receiptNo)}
       ${row('Paid on', d.paidOn)}
       ${row('Method', d.method)}
       <tr><td colspan="2" style="padding:8px 0;"><div style="height:1px;background:${brand.border};"></div></td></tr>
       ${row('Subtotal', d.subtotal)}
       ${row('Cleaning fee', d.cleaningFee)}
       ${row('Service fee', d.serviceFee)}
       ${row('Taxes', d.taxes)}
       <tr><td colspan="2" style="padding:8px 0;"><div style="height:1px;background:${brand.border};"></div></td></tr>
       ${row('Total charged', d.total, { strong: true, big: true })}
     </table>` +
    button('Download in the app', d.bookingUrl, brand.ink) +
    divider() +
    p(`This receipt is also saved to your account. Keep it for your records — it’s a valid tax document where applicable.`);
  return {
    subject: `Receipt ${d.receiptNo} — ${d.total}`,
    html: wrapEmail({ title: 'Payment receipt', preheader: `Receipt ${d.receiptNo} · ${d.total}`, bodyHtml: body }),
    text: `Receipt ${d.receiptNo}\n${d.listingTitle}\nPaid ${d.paidOn} via ${d.method}\n\nSubtotal ${d.subtotal}\nCleaning ${d.cleaningFee}\nService ${d.serviceFee}\nTaxes ${d.taxes}\nTotal ${d.total}`,
  };
}

export function wishlistPriceDrop(d: {
  name: string;
  listingTitle: string;
  city: string;
  oldPrice: string;
  newPrice: string;
  listingUrl: string;
}): EmailDoc {
  const body =
    h1('A saved stay just dropped in price.') +
    p(`${d.name.split(' ')[0]}, a home on your wishlist is now cheaper.`) +
    `<div style="background:${brand.cream};border:1px solid ${brand.border};border-radius:14px;padding:18px 20px;margin:6px 0 8px;">
       <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:18px;color:${brand.ink};">${d.listingTitle}</p>
       <p style="margin:0 0 10px;font-size:13px;color:${brand.inkSoft};">${d.city}</p>
       <span style="font-size:14px;color:${brand.inkSoft};text-decoration:line-through;">${d.oldPrice}</span>
       &nbsp;<span style="font-size:20px;font-weight:700;color:${brand.terracotta};">${d.newPrice}</span>
       <span style="font-size:13px;color:${brand.inkSoft};"> / night</span>
     </div>` +
    button('See the stay', d.listingUrl) +
    divider() +
    p(`Prices move — if this is the one, it’s worth a look now.`);
  return {
    subject: `Price drop: ${d.listingTitle} is now ${d.newPrice}`,
    html: wrapEmail({ title: 'Price drop', preheader: `${d.listingTitle} dropped to ${d.newPrice}/night`, bodyHtml: body }),
    text: `A saved stay dropped in price.\n${d.listingTitle}, ${d.city}\n${d.oldPrice} → ${d.newPrice}/night\nSee it: ${d.listingUrl}`,
  };
}

export function hostNewBooking(d: {
  hostName: string;
  listingTitle: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  payout: string;
  manageUrl: string;
}): EmailDoc {
  const body =
    h1('You’ve got a booking.') +
    p(`${d.hostName.split(' ')[0]}, ${strongInk(d.guestName)} just booked ${strongInk(d.listingTitle)}.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;">
       ${row('Check-in', d.checkIn)}
       ${row('Check-out', d.checkOut)}
       ${row('Your payout', d.payout, { strong: true, big: true })}
     </table>` +
    button('Manage the reservation', d.manageUrl) +
    divider() +
    p(`Payout is released 24 hours after check-in, to your saved method. A calm, well-prepared welcome is what keeps your rating high.`);
  return {
    subject: `New booking — ${d.listingTitle}, ${d.checkIn}`,
    html: wrapEmail({ title: 'New booking', preheader: `${d.guestName} booked ${d.listingTitle}`, bodyHtml: body }),
    text: `You've got a booking.\n${d.guestName} booked ${d.listingTitle}\nCheck-in ${d.checkIn} · Check-out ${d.checkOut}\nYour payout: ${d.payout}\nManage: ${d.manageUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Auth — these use Supabase {{ .Var }} placeholders so the identical markup can be
// pasted into supabase/templates/*.html (Supabase substitutes them). The functions
// here are for previewing + for any app-driven send.
// ---------------------------------------------------------------------------

export function magicLink(d: { url?: string; token?: string } = {}): EmailDoc {
  const url = d.url ?? '{{ .ConfirmationURL }}';
  const token = d.token ?? '{{ .Token }}';
  const body =
    h1('Your sign-in link') +
    p(`Tap the button to sign in to Ryo. This link is single-use and expires in an hour.`) +
    button('Sign in to Ryo', url) +
    p(`Or enter this code: ${strongInk(token)}`) +
    divider() +
    p(`Didn’t request this? You can safely ignore it — no one can sign in without the link.`);
  return {
    subject: 'Your Ryo sign-in link',
    html: wrapEmail({ title: 'Sign in to Ryo', preheader: 'Your single-use sign-in link (expires in 1 hour).', bodyHtml: body }),
    text: `Sign in to Ryo: ${url}\nOr use code: ${token}\n\nThis link is single-use and expires in an hour. Didn't request it? Ignore this email.`,
  };
}

export function passwordReset(d: { url?: string } = {}): EmailDoc {
  const url = d.url ?? '{{ .ConfirmationURL }}';
  const body =
    h1('Reset your password') +
    p(`Someone (hopefully you) asked to reset your Ryo password. Tap below to choose a new one. The link expires in an hour.`) +
    button('Choose a new password', url) +
    divider() +
    p(`If you didn’t ask for this, ignore this email — your password won’t change until you use the link.`);
  return {
    subject: 'Reset your Ryo password',
    html: wrapEmail({ title: 'Reset your password', preheader: 'Choose a new password (link expires in 1 hour).', bodyHtml: body }),
    text: `Reset your Ryo password: ${url}\n\nThe link expires in an hour. Didn't ask for this? Ignore this email.`,
  };
}

export function confirmSignup(d: { url?: string } = {}): EmailDoc {
  const url = d.url ?? '{{ .ConfirmationURL }}';
  const body =
    h1('Confirm your email') +
    p(`One tap and your Ryo account is ready.`) +
    button('Confirm my email', url) +
    divider() +
    p(`If you didn’t create a Ryo account, you can ignore this email.`);
  return {
    subject: 'Confirm your email for Ryo',
    html: wrapEmail({ title: 'Confirm your email', preheader: 'One tap to activate your Ryo account.', bodyHtml: body }),
    text: `Confirm your email for Ryo: ${url}`,
  };
}
