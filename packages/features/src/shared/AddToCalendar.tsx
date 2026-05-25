import { useState } from 'react';
import { View } from 'react-native';
import { Button, Calendar as CalendarIcon, Sheet, Text, toast, VStack } from '@bnb/ui';
import {
  downloadIcs,
  googleCalendarUrl,
  openGoogleCalendar,
  type CalendarEvent,
} from '@bnb/utils';

export type AddToCalendarProps = {
  /** The stay/event to add. */
  event: CalendarEvent;
  /** Button label. Defaults to "Add to calendar". */
  label?: string;
  /** Button variant (from @bnb/ui Button). Defaults to "outline". */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  fullWidth?: boolean;
  /** Optional helper line shown inside the chooser sheet. */
  hint?: string;
};

/**
 * "Add to calendar" affordance — a button that opens a chooser sheet offering
 * Google Calendar (deep link) and a downloadable .ics. Pure client-side, no
 * backend. On native, where window/document are absent, it falls back to a
 * toast that surfaces the Google link.
 */
export function AddToCalendar({
  event,
  label = 'Add to calendar',
  variant = 'outline',
  fullWidth,
  hint,
}: AddToCalendarProps) {
  const [open, setOpen] = useState(false);

  const onGoogle = () => {
    if (!openGoogleCalendar(event)) {
      toast.info('Add to Google Calendar', { description: googleCalendarUrl(event) });
    }
    setOpen(false);
  };

  const onIcs = () => {
    if (downloadIcs(event)) {
      toast.success('Calendar file downloading.', { description: `${event.title}.ics` });
    } else {
      toast.info('Calendar file', { description: 'Download is available in the web app.' });
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        title={label}
        variant={variant}
        fullWidth={fullWidth}
        leftIcon={<CalendarIcon size={16} color="#0E1A2B" />}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onClose={() => setOpen(false)} title="Add to calendar">
        <VStack className="gap-3 pt-1">
          <Text variant="small" className="text-ink-soft">
            {hint ?? 'Save this stay to your calendar so you never miss check-in.'}
          </Text>
          <View className="rounded-2xl bg-surface-alt px-4 py-3">
            <Text className="font-semibold" numberOfLines={2}>
              {event.title}
            </Text>
            {event.location ? (
              <Text variant="small" className="text-ink-soft mt-0.5">
                {event.location}
              </Text>
            ) : null}
          </View>
          <Button title="Google Calendar" variant="primary" fullWidth onPress={onGoogle} />
          <Button title="Download .ics file" variant="outline" fullWidth onPress={onIcs} />
          <Text variant="caption" className="text-ink-soft text-center">
            .ics works with Apple Calendar, Outlook and most calendar apps.
          </Text>
        </VStack>
      </Sheet>
    </>
  );
}
