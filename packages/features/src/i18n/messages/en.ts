// English — the canonical source catalogue. Every other locale is typed against
// this object's keys (see ../messages.ts), and any missing key in another locale
// falls back to the English string here. Keep keys grouped + dot-namespaced.

export const en = {
  // Brand
  'brand.tagline': 'Just Ryo it.',

  // Primary navigation / tabs
  'nav.explore': 'Explore',
  'nav.stays': 'Stays',
  'nav.discover': 'Discover',
  'nav.stories': 'Stories',
  'nav.trips': 'Trips',
  'nav.wishlists': 'Wishlists',
  'nav.profile': 'Profile',
  'nav.concierge': 'Concierge',
  'nav.account': 'Account',
  'nav.notifications': 'Notifications',
  'nav.help': 'Get help',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',

  // Search / filters
  'search.where': 'Where',
  'search.placeholder': 'Search countries and cities',
  'search.anywhere': 'Anywhere',
  'search.popular': 'Popular destinations',
  'search.guests': 'Guests',
  'search.guestsPlaceholder': 'Number of guests',
  'search.pricePerNight': 'Price per night',
  'search.min': 'Min',
  'search.max': 'Max',
  'search.propertyType': 'Property type',
  'search.amenities': 'Amenities',
  'search.filters': 'Filters',
  'search.clearAll': 'Clear all',
  'search.showStays': 'Show stays',

  // Common actions
  'common.search': 'Search',
  'common.apply': 'Apply',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.close': 'Close',
  'common.next': 'Next',
  'common.back': 'Back',
  'common.done': 'Done',
  'common.learnMore': 'Learn more',
  'common.getStarted': 'Get started',
  'common.skip': 'Skip',

  // Language switcher
  'language.title': 'Language',
  'language.choose': 'Choose your language',
  'language.subtitle': 'This changes the app interface language.',

  // Footer
  'footer.company': 'Ryo',
  'footer.tagline': 'Stay anywhere — and feel hosted.',
  'footer.explore': 'Explore',
  'footer.support': 'Support',
  'footer.legal': 'Legal',
  'footer.help': 'Help center',
  'footer.faq': 'FAQ',
  'footer.concierge': 'Concierge',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
  'footer.cookies': 'Cookie Policy',
  'footer.security': 'Security & Trust',
  'footer.rights': 'All rights reserved.',
  'footer.madeWith': 'Hosted with omotenashi.',

  // Cookie consent
  'cookies.title': 'We value your privacy',
  'cookies.body':
    'We use cookies to keep you signed in, remember your preferences, and understand how Ryo is used. You choose what we may use.',
  'cookies.acceptAll': 'Accept all',
  'cookies.rejectAll': 'Reject non-essential',
  'cookies.customize': 'Customize',
  'cookies.savePrefs': 'Save preferences',
  'cookies.necessary': 'Strictly necessary',
  'cookies.necessaryDesc': 'Required for sign-in, security, and core features. Always on.',
  'cookies.functional': 'Functional',
  'cookies.functionalDesc': 'Remember your language and preferences.',
  'cookies.analytics': 'Analytics',
  'cookies.analyticsDesc': 'Help us understand usage to improve Ryo.',
  'cookies.learnMore': 'Read our Cookie Policy',
  'cookies.preferences': 'Cookie preferences',

  // Onboarding (first-run guidance)
  'onboarding.welcomeTitle': 'Welcome to Ryo',
  'onboarding.welcomeBody':
    'Vetted hosts, a 24/7 concierge, and honest pricing — places to stay that feel prepared just for you.',
  'onboarding.searchTitle': 'Search the whole world',
  'onboarding.searchBody':
    'Find stays in every country and thousands of cities. Filter by price, guests, and the amenities that matter to you.',
  'onboarding.conciergeTitle': 'A concierge, day or night',
  'onboarding.conciergeBody':
    'Ask anything before, during, or after your stay — in your language, 24/7.',
  'onboarding.trustTitle': 'Stay with confidence',
  'onboarding.trustBody':
    'Verified hosts, secure messaging and payments, and real guarantees behind every booking.',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
