// Server-safe entry point for @bnb/api.
//
// The main barrel (./index.ts) re-exports client-only modules (auth, demo-auth,
// admin-store, host-calendar-store — all using React hooks), so importing it
// from a Next.js server route (e.g. the concierge API) fails the build with
// "this hook only works in a Client Component".
//
// Server code (route handlers, server actions) should import data functions
// from here instead. Only modules free of client React hooks may be re-exported.
export { fetchListings, fetchListing } from './listings';
