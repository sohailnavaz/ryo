import { useState } from 'react';
import { View } from 'react-native';
import { useAdminUsers, type AdminUser } from '@bnb/api';
import {
  Avatar,
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

export function AdminUsersScreen() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useAdminUsers(q);
  const router = useRouter();

  return (
    <AdminShell
      title="Users"
      subtitle="Every account on file. Click a row for the full inspector."
    >
      <View className="mt-6">
        <Input
          placeholder="Search by name, email, role…"
          value={q}
          onChangeText={setQ}
        />
      </View>

      <View className="mt-4">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-ink-soft">No users match “{q}”.</Text>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <View className="hidden md:flex md:flex-row md:bg-surface-alt md:px-5 md:py-3 md:border-b md:border-surface-border">
              <Text variant="label" className="flex-[2]">User</Text>
              <Text variant="label" className="flex-1">Role</Text>
              <Text variant="label" className="flex-1">Joined</Text>
              <Text variant="label" className="flex-1">Bookings</Text>
              <Text variant="label" className="flex-1 text-right">Status</Text>
            </View>
            {data.map((u, i) => (
              <UserRow
                key={u.id}
                u={u}
                last={i === data.length - 1}
                onPress={() => router.push(`/admin/users/${u.id}`)}
              />
            ))}
          </Card>
        )}
      </View>
    </AdminShell>
  );
}

function UserRow({
  u,
  last,
  onPress,
}: {
  u: AdminUser;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        className={`px-4 py-3 md:px-5 md:flex-row md:items-center ${last ? '' : 'border-b border-surface-border'}`}
      >
        <HStack className="flex-[2] gap-3">
          <Avatar name={u.display_name} size={32} />
          <VStack className="flex-1 gap-0.5">
            <Text className="font-semibold" numberOfLines={1}>{u.display_name}</Text>
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>{u.email}</Text>
          </VStack>
        </HStack>
        <View className="hidden md:flex flex-1">
          <Badge variant={u.role === 'admin' || u.role === 'concierge' ? 'dark' : 'neutral'}>
            {u.role}
          </Badge>
        </View>
        <Text variant="small" className="hidden md:flex flex-1 text-ink-soft">
          {u.joined}
        </Text>
        <Text variant="small" className="hidden md:flex flex-1 text-ink-soft">
          {u.bookings}
        </Text>
        <View className="hidden md:flex flex-1 items-end">
          <Badge variant={u.status === 'suspended' ? 'brand' : 'neutral'}>{u.status}</Badge>
        </View>
      </View>
    </Pressable>
  );
}
