/**
 * Add-to-calendar helpers — pure, dependency-free, client-side.
 *
 * Two outputs from one event shape:
 *   1. `googleCalendarUrl(...)` — a calendar.google.com "TEMPLATE" deep link.
 *   2. `icsContent(...)` / `icsDataUri(...)` / `icsBlob(...)` — a valid VEVENT
 *      .ics payload for Apple Calendar, Outlook, etc.
 *
 * Dates may be passed as `Date`, an ISO datetime, or a `YYYY-MM-DD` date string.
 * A `YYYY-MM-DD` value (with no time component) is treated as an **all-day**
 * event; anything with a time becomes a timed (UTC) event.
 *
 * No network, no keys, no SDK — everything is built from the booking data.
 */

export type CalendarEvent = {
  /** Event title, e.g. the listing title. */
  title: string;
  /** Long-form description, e.g. the confirmation code + notes. */
  details?: string;
  /** Human-readable location, e.g. "Kyoto, Japan". */
  location?: string;
  /** Start — Date, ISO datetime, or YYYY-MM-DD (all-day). */
  start: Date | string;
  /** End — Date, ISO datetime, or YYYY-MM-DD. For all-day this is exclusive (the day after the last day). */
  end: Date | string;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function isAllDay(e: CalendarEvent): boolean {
  return (
    typeof e.start === 'string' &&
    DATE_ONLY.test(e.start) &&
    typeof e.end === 'string' &&
    DATE_ONLY.test(e.end)
  );
}

/** `YYYY-MM-DD` → `YYYYMMDD` (all-day form). */
function basicDate(d: string): string {
  return d.replace(/-/g, '');
}

/** Any date-ish value → UTC `YYYYMMDDTHHMMSSZ` (timed form). */
function basicDateTimeUTC(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  const iso = d.toISOString(); // 2026-05-23T15:00:00.000Z
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * A Google Calendar "add event" URL. Opening it pre-fills the new-event form.
 * Dates use the `start/end` basic format; all-day events use `YYYYMMDD/YYYYMMDD`
 * (Google treats the end as exclusive, matching a stay's checkout day).
 */
export function googleCalendarUrl(e: CalendarEvent): string {
  const allDay = isAllDay(e);
  const dates = allDay
    ? `${basicDate(e.start as string)}/${basicDate(e.end as string)}`
    : `${basicDateTimeUTC(e.start)}/${basicDateTimeUTC(e.end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates,
  });
  if (e.details) params.set('details', e.details);
  if (e.location) params.set('location', e.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Escape a value for an ICS text field per RFC 5545. */
function icsEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** A short stable UID for the event (so re-imports update rather than duplicate). */
function eventUid(e: CalendarEvent): string {
  const seed = `${e.title}|${String(e.start)}|${String(e.end)}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return `${h.toString(36)}@ryo.app`;
}

/**
 * A complete VCALENDAR/VEVENT .ics document as a string. CRLF line endings per
 * RFC 5545. Works for all-day (DATE) and timed (UTC) events.
 */
export function icsContent(e: CalendarEvent): string {
  const allDay = isAllDay(e);
  const stamp = basicDateTimeUTC(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ryo//Add to calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventUid(e)}`,
    `DTSTAMP:${stamp}`,
    allDay
      ? `DTSTART;VALUE=DATE:${basicDate(e.start as string)}`
      : `DTSTART:${basicDateTimeUTC(e.start)}`,
    allDay
      ? `DTEND;VALUE=DATE:${basicDate(e.end as string)}`
      : `DTEND:${basicDateTimeUTC(e.end)}`,
    `SUMMARY:${icsEscape(e.title)}`,
  ];
  if (e.details) lines.push(`DESCRIPTION:${icsEscape(e.details)}`);
  if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/** A `data:` URI carrying the .ics content — usable as an `href` for download. */
export function icsDataUri(e: CalendarEvent): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent(e))}`;
}

/**
 * A `Blob` of the .ics content (web only — `Blob` is a browser/Node API).
 * Returns `null` where `Blob` is unavailable (e.g. React Native).
 */
export function icsBlob(e: CalendarEvent): Blob | null {
  if (typeof Blob === 'undefined') return null;
  return new Blob([icsContent(e)], { type: 'text/calendar;charset=utf-8' });
}

/** A filesystem-safe `.ics` filename derived from the event title. */
export function icsFileName(e: CalendarEvent): string {
  const slug = e.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${slug || 'ryo-stay'}.ics`;
}

/**
 * Open a Google Calendar event-add form in a new tab (web only).
 * Returns `true` if it could act, `false` on native / non-browser (so the
 * caller can fall back to a toast).
 */
export function openGoogleCalendar(e: CalendarEvent): boolean {
  if (typeof window === 'undefined' || typeof window.open !== 'function') return false;
  window.open(googleCalendarUrl(e), '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Trigger a download of the .ics file (web only). Returns `true` if it could
 * act, `false` on native / non-browser (so the caller can fall back to a toast).
 */
export function downloadIcs(e: CalendarEvent): boolean {
  if (typeof document === 'undefined') return false;
  const blob = icsBlob(e);
  const href = blob ? URL.createObjectURL(blob) : icsDataUri(e);
  const a = document.createElement('a');
  a.href = href;
  a.download = icsFileName(e);
  a.click();
  if (blob) URL.revokeObjectURL(href);
  return true;
}
