'use client';
import { useMemo } from 'react';
import { DayPicker, type DateRange, type Matcher } from 'react-day-picker';
import 'react-day-picker/style.css';
import { toISODate } from '@bnb/utils';

export type CalendarBookedRange = { start: string; end: string };

export type CalendarProps = {
  startDate?: string;
  endDate?: string;
  onChange: (start?: string, end?: string) => void;
  minDate?: Date;
  /**
   * Already-booked ranges to grey out and block. `end` is the checkout day
   * (exclusive) — the last unavailable night is the day before, so a new stay
   * may still check in on `end`.
   */
  bookedRanges?: CalendarBookedRange[];
};

export function Calendar({ startDate, endDate, onChange, minDate, bookedRanges }: CalendarProps) {
  const selected = useMemo<DateRange | undefined>(() => {
    if (!startDate) return undefined;
    return {
      from: new Date(startDate),
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const disabled = useMemo<Matcher[]>(() => {
    const matchers: Matcher[] = [{ before: minDate ?? new Date() }];
    for (const r of bookedRanges ?? []) {
      const from = new Date(r.start);
      const to = new Date(r.end);
      to.setDate(to.getDate() - 1); // checkout day stays selectable
      if (to >= from) matchers.push({ from, to });
    }
    return matchers;
  }, [minDate, bookedRanges]);

  return (
    <DayPicker
      mode="range"
      numberOfMonths={2}
      pagedNavigation
      // Prevents a selected range from spanning a booked block.
      excludeDisabled
      disabled={disabled}
      selected={selected}
      onSelect={(range) => {
        onChange(
          range?.from ? toISODate(range.from) : undefined,
          range?.to ? toISODate(range.to) : undefined,
        );
      }}
      styles={{
        caption: { color: '#222' },
        day: { borderRadius: 9999 },
      }}
      modifiersStyles={{
        selected: { background: '#222', color: '#fff' },
        range_start: { background: '#222', color: '#fff' },
        range_end: { background: '#222', color: '#fff' },
        range_middle: { background: '#f7f7f7', color: '#222' },
        disabled: { color: '#c2c2c2', textDecoration: 'line-through' },
      }}
    />
  );
}
