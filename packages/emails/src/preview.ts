import { mkdirSync, writeFileSync } from 'node:fs';
import * as T from './templates';

const OUT = '/tmp/ryo-emails';
mkdirSync(OUT, { recursive: true });

const samples: Record<string, { subject: string; html: string }> = {
  welcome: T.welcome({ name: 'Mira Anand' }),
  'booking-confirmation': T.bookingConfirmation({
    guestName: 'Mira Anand', listingTitle: 'Cliffside villa with ocean view', city: 'Positano, Italy',
    checkIn: 'Sat 12 Jul', checkOut: 'Tue 15 Jul', nights: 3, guests: '2 adults', total: '₹61,880',
    bookingUrl: 'https://ryo-web.vercel.app/trips/abc',
  }),
  'payment-receipt': T.paymentReceipt({
    guestName: 'Mira Anand', listingTitle: 'Cliffside villa with ocean view', receiptNo: 'RYO-8F3K2A',
    paidOn: '9 Jul 2026', method: 'Visa ···· 4242', subtotal: '₹50,000', cleaningFee: '₹2,000',
    serviceFee: '₹7,280', taxes: '₹2,600', total: '₹61,880', bookingUrl: 'https://ryo-web.vercel.app/trips/abc',
  }),
  'wishlist-price-drop': T.wishlistPriceDrop({
    name: 'Mira', listingTitle: 'Tiny home by the lake', city: 'Queenstown, New Zealand',
    oldPrice: '₹9,800', newPrice: '₹7,900', listingUrl: 'https://ryo-web.vercel.app/listing/xyz',
  }),
  'host-new-booking': T.hostNewBooking({
    hostName: 'Kenji', listingTitle: 'Cliffside villa', guestName: 'Mira Anand',
    checkIn: 'Sat 12 Jul', checkOut: 'Tue 15 Jul', payout: '₹50,440', manageUrl: 'https://ryo-web.vercel.app/host/bookings/abc',
  }),
  'magic-link': T.magicLink({ url: 'https://ryo-web.vercel.app/auth/callback?token=demo', token: '824193' }),
  'password-reset': T.passwordReset({ url: 'https://ryo-web.vercel.app/reset-password?token=demo' }),
  'confirm-signup': T.confirmSignup({ url: 'https://ryo-web.vercel.app/auth/callback?token=demo' }),
};

for (const [name, doc] of Object.entries(samples)) {
  writeFileSync(`${OUT}/${name}.html`, doc.html);
  // eslint-disable-next-line no-console
  console.log(`✓ ${name}  —  "${doc.subject}"`);
}
console.log(`\nWrote ${Object.keys(samples).length} templates to ${OUT}`);
