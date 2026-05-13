import { useState } from 'react';
import { View } from 'react-native';
import { useAdminGlobalSearch, type AdminSearchResult } from '@bnb/api';
import {
  Badge,
  Card,
  HStack,
  Input,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { AdminShell } from './shell';

type Kind = AdminSearchResult['kind'];
const KIND_LABEL: Record<Kind, string> = {
  user: 'User',
  booking: 'Booking',
  listing: 'Listing',
  incident: 'Incident',
};

export function AdminSearchScreen() {
  const [q, setQ] = useState('');
  const { data, isLoading, isFetched } = useAdminGlobalSearch(q);
  const router = useRouter();

  const grouped = (data ?? []).reduce<Record<Kind, AdminSearchResult[]>>(
    (acc, r) => {
      (acc[r.kind] ??= []).push(r);
      return acc;
    },
    { user: [], booking: [], listing: [], incident: [] },
  );

  function openResult(r: AdminSearchResult) {
    if (r.kind === 'user') router.push(`/admin/users/${r.id}`);
    else if (r.kind === 'booking') router.push(`/admin/bookings/${r.id}`);
    else if (r.kind === 'listing') router.push(`/listing/${r.id}`);
    else router.push('/admin/incidents');
  }

  return (
    <AdminShell
      title="Global search"
      subtitle="Find anything by id, email, name, or city — across users, bookings, listings, incidents."
    >
      <View className="mt-6">
        <Input
          placeholder="Try “mira” or “positano” or a booking id"
          value={q}
          onChangeText={setQ}
          autoFocus
        />
      </View>

      <View className="mt-6">
        {q.trim().length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-ink-soft text-center">
              Type to search. Suggestions appear instantly across all four entity types.
            </Text>
          </Card>
        ) : isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !isFetched || !data || data.length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-ink-soft">No matches for “{q}”.</Text>
          </Card>
        ) : (
          <VStack className="gap-6">
            {(Object.keys(grouped) as Kind[]).map((k) =>
              grouped[k].length > 0 ? (
                <View key={k}>
                  <HStack className="gap-2 items-center">
                    <Text className="font-semibold">{KIND_LABEL[k]}</Text>
                    <Badge variant="neutral">{grouped[k].length}</Badge>
                  </HStack>
                  <VStack className="mt-2 gap-2">
                    {grouped[k].slice(0, 8).map((r) => (
                      <Pressable key={`${r.kind}-${r.id}`} onPress={() => openResult(r)}>
                        <Card className="px-4 py-3">
                          <HStack className="gap-3 justify-between">
                            <VStack className="flex-1 gap-0.5">
                              <Text className="font-semibold" numberOfLines={1}>{r.label}</Text>
                              <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                                {r.sub}
                              </Text>
                            </VStack>
                            <Text variant="caption" className="text-ink-soft">{r.id}</Text>
                          </HStack>
                        </Card>
                      </Pressable>
                    ))}
                  </VStack>
                </View>
              ) : null,
            )}
          </VStack>
        )}
      </View>
    </AdminShell>
  );
}
