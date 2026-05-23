// Concierge guardrails: rate limiting + PII redaction.
//
// These are deliberately dependency-free and in-memory. On a single Vercel
// instance this gives basic abuse protection; when the concierge graduates to
// real traffic, swap the limiter for a shared store (Upstash/Redis) keyed the
// same way. The PII redaction is defense-in-depth on tool output — our tools
// only ever return public listing data, but we scrub anyway so a future tool
// can't accidentally leak a contact detail into the model's context.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20; // per IP per window

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

/** Best-effort client key from forwarded headers (Vercel sets x-forwarded-for). */
export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'anon';
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// International-ish phone numbers: optional +, 7+ digits with separators.
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/g;
// Bare UUIDs (e.g. host_id) — never useful to a guest, often an internal handle.
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/** Strip emails, phone numbers and UUIDs from any string handed back to the model. */
export function redactPII(text: string): string {
  return text
    .replace(EMAIL_RE, '[redacted]')
    .replace(UUID_RE, '[redacted]')
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, '').length >= 7 ? '[redacted]' : m));
}
