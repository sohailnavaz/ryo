import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

export function nightsBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  if (!isValid(s) || !isValid(e)) return 0;
  return Math.max(0, differenceInCalendarDays(e, s));
}

export function formatDateShort(d: Date | string): string {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, 'MMM d');
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  const sameMonth = format(s, 'yyyy-MM') === format(e, 'yyyy-MM');
  if (sameMonth) return `${format(s, 'MMM d')} – ${format(e, 'd')}`;
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
}

export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}
