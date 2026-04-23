'use client';
import { useMemo } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { toISODate } from '@bnb/utils';

export type CalendarProps = {
  startDate?: string;
  endDate?: string;
  onChange: (start?: string, end?: string) => void;
  minDate?: Date;
};

export function Calendar({ startDate, endDate, onChange, minDate }: CalendarProps) {
  const selected = useMemo<DateRange | undefined>(() => {
    if (!startDate) return undefined;
    return {
      from: new Date(startDate),
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  return (
    <DayPicker
      mode="range"
      numberOfMonths={2}
      pagedNavigation
      disabled={minDate ? { before: minDate } : { before: new Date() }}
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
      }}
    />
  );
}
