import { useMemo } from 'react';
import { Calendar as RNCalendar, type DateData } from 'react-native-calendars';
import { toISODate } from '@bnb/utils';

export type CalendarBookedRange = { start: string; end: string };

export type CalendarProps = {
  startDate?: string;
  endDate?: string;
  onChange: (start?: string, end?: string) => void;
  /**
   * Already-booked ranges to grey out and block. `end` is the checkout day
   * (exclusive) — the last unavailable night is the day before.
   */
  bookedRanges?: CalendarBookedRange[];
};

type Mark = {
  startingDay?: boolean;
  endingDay?: boolean;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  disableTouchEvent?: boolean;
};

export function Calendar({ startDate, endDate, onChange, bookedRanges }: CalendarProps) {
  /** Set of every booked night (start..end-1 inclusive) for fast lookup + marking. */
  const bookedDays = useMemo(() => {
    const set = new Set<string>();
    for (const r of bookedRanges ?? []) {
      const last = new Date(r.end);
      last.setDate(last.getDate() - 1); // checkout day stays selectable
      for (let d = new Date(r.start); d <= last; d.setDate(d.getDate() + 1)) {
        set.add(toISODate(d));
      }
    }
    return set;
  }, [bookedRanges]);

  const marked = useMemo(() => {
    const result: Record<string, Mark> = {};
    for (const iso of bookedDays) {
      result[iso] = { disabled: true, disableTouchEvent: true, color: '#f0f0f0', textColor: '#c2c2c2' };
    }
    if (!startDate) return result;
    if (!endDate) {
      result[startDate] = { startingDay: true, endingDay: true, color: '#222', textColor: '#fff' };
      return result;
    }
    const s = new Date(startDate);
    const e = new Date(endDate);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const iso = toISODate(d);
      const isStart = iso === startDate;
      const isEnd = iso === endDate;
      result[iso] = {
        color: isStart || isEnd ? '#222' : '#f7f7f7',
        textColor: isStart || isEnd ? '#fff' : '#222',
        startingDay: isStart,
        endingDay: isEnd,
      };
    }
    return result;
  }, [startDate, endDate, bookedDays]);

  /** True if any booked night falls inside [from, to). */
  const rangeHitsBooked = (from: string, to: string): boolean => {
    for (let d = new Date(from); toISODate(d) < to; d.setDate(d.getDate() + 1)) {
      if (bookedDays.has(toISODate(d))) return true;
    }
    return false;
  };

  const onDayPress = (day: DateData) => {
    const iso = day.dateString;
    if (bookedDays.has(iso)) return; // can't start/end on a booked night
    if (!startDate || (startDate && endDate)) {
      onChange(iso, undefined);
      return;
    }
    if (iso < startDate) {
      onChange(iso, undefined);
      return;
    }
    // Don't allow a range that spans a booked block — restart from the new day.
    if (rangeHitsBooked(startDate, iso)) {
      onChange(iso, undefined);
      return;
    }
    onChange(startDate, iso);
  };

  return (
    <RNCalendar
      markingType="period"
      markedDates={marked}
      onDayPress={onDayPress}
      minDate={toISODate(new Date())}
      theme={{
        todayTextColor: '#C87156',
        arrowColor: '#222',
      }}
    />
  );
}
