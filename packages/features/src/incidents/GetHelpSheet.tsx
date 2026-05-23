import { useState } from 'react';
import { View } from 'react-native';
import {
  INCIDENT_CATEGORIES,
  categoryLabel,
  tierForCategory,
  useCreateIncident,
  useUser,
  type IncidentCategory,
} from '@bnb/api';
import { Badge, Button, Input, Pressable, Sheet, Text, VStack, toast } from '@bnb/ui';

/** Minimal booking context the help flow attaches to a new incident. */
export type GetHelpBookingContext = {
  id: string;
  listing_id: string;
  listing_title: string;
  host_name?: string | null;
};

export type GetHelpSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Trip the guest is asking for help with — attaches booking + listing context. */
  booking?: GetHelpBookingContext | null;
  /** Called with the new incident id once it's opened. */
  onCreated?: (incidentId: string) => void;
};

/**
 * Self-contained "Get help" flow (docs/12 concierge, docs/14 §3.6). Drops into
 * trip detail (L2 owns the button; this sheet owns the flow): pick a category,
 * describe the problem, and an incident opens with the booking attached — then
 * tracked in `GuestIncidentsScreen` and surfaced to staff in the admin queue.
 */
export function GetHelpSheet({ open, onClose, booking, onCreated }: GetHelpSheetProps) {
  const user = useUser();
  const create = useCreateIncident();
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [detail, setDetail] = useState('');

  const reset = () => {
    setCategory(null);
    setDetail('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const guestName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Guest';

  const submit = () => {
    if (!category) return;
    if (!user?.id) {
      toast.error('Please sign in to get help with this trip.');
      return;
    }
    const subject = booking
      ? `${categoryLabel(category)} — ${booking.listing_title}`
      : categoryLabel(category);
    create.mutate(
      {
        guest_id: user.id,
        guest_name: guestName,
        category,
        subject,
        detail: detail.trim() || categoryLabel(category),
        booking_id: booking?.id ?? null,
        listing_id: booking?.listing_id ?? null,
        listing_title: booking?.listing_title ?? null,
        host_name: booking?.host_name ?? null,
      },
      {
        onSuccess: (incident) => {
          const urgent = tierForCategory(category) === 1;
          toast.success(
            urgent ? 'Help is on the way — this is a priority.' : "We've got it from here.",
            {
              description: urgent
                ? 'A concierge has been alerted. Track the response in Help.'
                : "We've opened a case. Track its status in Help.",
            },
          );
          onCreated?.(incident.id);
          close();
        },
        onError: () => toast.error("Couldn't open your request. Please try again."),
      },
    );
  };

  return (
    <Sheet open={open} onClose={close} title="Get help">
      <VStack className="gap-4">
        {booking ? (
          <Text variant="small" className="text-ink-soft">
            About your stay at {booking.listing_title}
          </Text>
        ) : (
          <Text variant="small" className="text-ink-soft">
            Tell us what's happening and we'll take it from here.
          </Text>
        )}

        <VStack className="gap-2">
          <Text className="font-semibold">What do you need help with?</Text>
          {INCIDENT_CATEGORIES.map((c) => {
            const selected = category === c.code;
            return (
              <Pressable key={c.code} onPress={() => setCategory(c.code)}>
                <View
                  className={`rounded-2xl border px-4 py-3 ${
                    selected ? 'border-ink border-2 bg-surface-alt' : 'border-surface-border'
                  }`}
                >
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-semibold">{c.label}</Text>
                    {tierForCategory(c.code) === 1 ? <Badge variant="brand">Urgent</Badge> : null}
                  </View>
                  <Text variant="small" className="text-ink-soft mt-0.5">
                    {c.hint}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </VStack>

        <VStack className="gap-2">
          <Text className="font-semibold">Anything we should know?</Text>
          <Input
            value={detail}
            onChangeText={setDetail}
            placeholder="Describe what's going on (optional)"
            multiline
            numberOfLines={4}
            className="min-h-[88px]"
            style={{ textAlignVertical: 'top' }}
          />
        </VStack>

        <Button disabled={!category || create.isPending} onPress={submit}>
          {create.isPending ? 'Opening…' : 'Get help'}
        </Button>
      </VStack>
    </Sheet>
  );
}
