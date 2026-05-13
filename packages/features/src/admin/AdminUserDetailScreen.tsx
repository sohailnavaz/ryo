import { useState } from 'react';
import { View } from 'react-native';
import { useAdminUser } from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

type Tab = 'profile' | 'bookings' | 'tickets' | 'audit';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'profile',  label: 'Profile' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'tickets',  label: 'Tickets' },
  { key: 'audit',    label: 'Audit trail' },
];

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const { data, isLoading } = useAdminUser(userId);
  const [tab, setTab] = useState<Tab>('profile');
  const router = useRouter();

  if (isLoading) {
    return (
      <AdminShell title="User" subtitle="Loading…">
        <Skeleton className="mt-6 h-96 w-full" />
      </AdminShell>
    );
  }
  if (!data) {
    return (
      <AdminShell title="User not found" subtitle="Maybe the id is wrong.">
        <Card className="mt-6 p-6">
          <Button variant="secondary" onPress={() => router.push('/admin/users')}>
            Back to users
          </Button>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={data.display_name} subtitle={`${data.email} · ${data.role}`}>
      <HStack className="mt-2 gap-2 flex-wrap">
        <Badge variant={data.status === 'suspended' ? 'brand' : 'neutral'}>{data.status}</Badge>
        {data.verified ? <Badge variant="neutral">verified</Badge> : null}
        <Badge variant="neutral">{data.signed_up_via.replace('_', ' ')}</Badge>
        <Badge variant="neutral">last active {data.last_active}</Badge>
      </HStack>

      <HStack className="mt-6 gap-2 flex-wrap">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`rounded-full border px-4 py-2 ${
              tab === t.key ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
            }`}
          >
            <Text
              variant="small"
              className={tab === t.key ? 'text-white font-semibold' : 'text-ink'}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </HStack>

      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1">
          {tab === 'profile' ? <ProfileTab data={data} /> : null}
          {tab === 'bookings' ? <BookingsTab data={data} /> : null}
          {tab === 'tickets' ? <TicketsTab /> : null}
          {tab === 'audit' ? <AuditTab data={data} /> : null}
        </View>

        <View className="md:w-[320px] gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Actions</Text>
            <VStack className="mt-3 gap-2">
              <Button
                variant="outline"
                onPress={() =>
                  toast.info('Preview only — would open suspension flow with reason code.')
                }
              >
                {data.status === 'suspended' ? 'Reinstate' : 'Suspend'}
              </Button>
              <Button
                variant="outline"
                onPress={() => toast.info('Preview only — opens credit issuance flow.')}
              >
                Issue credit
              </Button>
              <Button
                variant="outline"
                onPress={() => toast.info('Preview only — would force sign-out across devices.')}
              >
                Force sign-out
              </Button>
            </VStack>
            <Text variant="caption" className="mt-3 text-ink-soft">
              All actions require a reason code + are written to the audit log.
            </Text>
          </Card>

          {data.notes.length > 0 ? (
            <Card className="p-5">
              <Text className="font-semibold">Internal notes</Text>
              <VStack className="mt-3 gap-2">
                {data.notes.map((n, i) => (
                  <Text key={i} variant="small" className="text-ink-soft">• {n}</Text>
                ))}
              </VStack>
            </Card>
          ) : null}
        </View>
      </View>
    </AdminShell>
  );
}

function ProfileTab({ data }: { data: NonNullable<ReturnType<typeof useAdminUser>['data']> }) {
  return (
    <Card className="p-5">
      <HStack className="gap-4 items-center">
        <Avatar name={data.display_name} size={64} />
        <VStack className="flex-1 gap-0.5">
          <Text className="font-semibold">{data.display_name}</Text>
          <Text variant="small" className="text-ink-soft">{data.email}</Text>
          <Text variant="small" className="text-ink-soft">{data.phone}</Text>
        </VStack>
      </HStack>
      <Divider className="my-4" />
      <Row label="Role"        value={data.role} />
      <Row label="Joined"      value={data.joined} />
      <Row label="Last active" value={data.last_active} />
      <Row label="Location"    value={`${data.city}, ${data.country}`} />
      <Row label="Verified"    value={data.verified ? 'Yes' : 'No'} />
      <Row label="Sign-up via" value={data.signed_up_via.replace('_', ' ')} />
    </Card>
  );
}

function BookingsTab({ data }: { data: NonNullable<ReturnType<typeof useAdminUser>['data']> }) {
  if (data.bookings_as_guest.length === 0) {
    return (
      <Card className="p-6 items-center">
        <Text className="text-ink-soft">No bookings on file.</Text>
      </Card>
    );
  }
  return (
    <Card className="p-0 overflow-hidden">
      {data.bookings_as_guest.map((b, i) => (
        <View
          key={b.id}
          className={`px-4 py-3 md:px-5 md:flex-row md:items-center ${i < data.bookings_as_guest.length - 1 ? 'border-b border-surface-border' : ''}`}
        >
          <VStack className="flex-1 gap-0.5">
            <Text className="font-semibold" numberOfLines={1}>{b.listing_title}</Text>
            <Text variant="small" className="text-ink-soft">
              {b.start_date} → {b.end_date}
            </Text>
          </VStack>
          <Badge variant={b.status === 'in_stay' ? 'brand' : 'neutral'}>{b.status}</Badge>
          <Text className="md:ml-4 font-semibold">{formatPrice(b.total_cents, b.currency)}</Text>
        </View>
      ))}
    </Card>
  );
}

function TicketsTab() {
  return (
    <Card className="p-6 items-center">
      <Text className="text-ink-soft">No tickets open. History will surface here.</Text>
    </Card>
  );
}

function AuditTab({ data }: { data: NonNullable<ReturnType<typeof useAdminUser>['data']> }) {
  if (data.audit_trail.length === 0) {
    return (
      <Card className="p-6 items-center">
        <Text className="text-ink-soft">No staff actions recorded against this user.</Text>
      </Card>
    );
  }
  return (
    <VStack className="gap-2">
      {data.audit_trail.map((e) => (
        <Card key={e.id} className="px-4 py-3">
          <VStack className="gap-0.5">
            <HStack className="gap-2 items-center">
              <Text className="font-semibold">{e.action.replace(/_/g, ' ')}</Text>
              <Badge variant="neutral">{e.reason_code}</Badge>
            </HStack>
            <Text variant="small" className="text-ink-soft">{e.actor} · {e.created_at}</Text>
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between py-1">
      <Text variant="small" className="text-ink-soft">{label}</Text>
      <Text>{value}</Text>
    </HStack>
  );
}
