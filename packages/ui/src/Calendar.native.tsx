import { useMemo } from 'react';
import { Calendar as RNCalendar, type DateData } from 'react-native-calendars';
import { toISODate } from '@bnb/utils';

export type CalendarProps = {
  startDate?: string;
  endDate?: string;
  onChange: (start?: string, end?: string) => void;
};

export function Calendar({ startDate, endDate, onChange }: CalendarProps) {
  const marked = useMemo(() => {
    if (!startDate) return {};
    const result: Record<string, { startingDay?: boolean; endingDay?: boolean; color: string; textColor: string }> = {};
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
  }, [startDate, endDate]);

  const onDayPress = (day: DateData) => {
    const iso = day.dateString;
    if (!startDate || (startDate && endDate)) {
      onChange(iso, undefined);
      return;
    }
    if (iso < startDate) {
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
        todayTextColor: '#ff385c',
        arrowColor: '#222',
      }}
    />
  );
}
