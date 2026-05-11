import { ScrollView, View } from 'react-native';
import { useAdminDashboard } from '@bnb/api';
import {
  Avatar,
  Badge,
  Card,
  Divider,
  Heading,
  HStack,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';
import { PreviewBanner, SectionHeader } from '../host/HostDashboardScreen';

export function AdminDashboardScreen() {
  const router = useRouter();
  const { data, isLoading } = useAdminDashboard();

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="md:mx-auto md:w-full md:max-w-[1280px] px-4 pt-4 pb-20 md:px-10 md:pt-8">
        <PreviewBanner kind="admin" />

        <VStack className="mt-6 gap-1">
          <Text variant="small" className="text-ink-soft uppercase tracking-wider">
            Maintenance · Operations
          </Text>
          <Heading level={1}>Platform overview</Heading>
          <Text className="text-ink-soft">
            What's moving across Ryo right now. All numbers refresh on page load.
          </Text>
        </VStack>

        {isLoading || !data ? (
          <KpiSkeletons />
        ) : (
          <KpiRow stats={data.stats} />
        )}

        {/* Two-column on desktop */}
        <View className="mt-10 flex-col md:flex-row gap-6">
          <View className="flex-1 md:max-w-[680px] gap-6">
            <View>
              <SectionHeader
                title="Recent bookings"
                subtitle="Last to be created — across every host"
              />
              {isLoading || !data ? (
                <ListSkeleton rows={4} />
              ) : (
                <RecentBookings
                  bookings={data.recent_bookings}
                  onPressListing={(id) => router.push(`/listing/${id}`)}
                />
              )}
            </View>

            <View>
              <SectionHeader
                title="Moderation queue"
                subtitle={`${data?.moderation.length ?? 0} listings awaiting decision`}
              />
              {isLoading || !data ? (
                <ListSkeleton rows={3} />
              ) : (
                <ModerationQueue items={data.moderation} />
              )}
            </View>
          </View>

          <View className="flex-1 md:max-w-[480px] gap-6">
            <View>
              <SectionHeader title="System health" subtitle="30-day rolling, refreshed hourly" />
              {isLoading || !data ? (
                <Skeleton className="mt-3 h-72 w-full" />
              ) : (
                <SystemHealth health={data.health} />
              )}
            </View>

            <View>
              <SectionHeader title="Audit log" subtitle="Privileged staff actions" />
              {isLoading || !data ? (
                <ListSkeleton rows={4} />
              ) : (
                <AuditFeed entries={data.audit} />
              )}
            </View>
          </View>
        </View>

        <SectionHeader title="Users" subtitle={`${data?.users.length ?? 0} on file`} />
        {isLoading || !data ? <ListSkeleton rows={5} /> : <UsersTable users={data.users} />}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function KpiRow({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['stats'];
}) {
  return (
    <View className="mt-6 flex-row flex-wrap gap-4">
      <KpiCard label="Users" value={String(stats.total_users)} hint={`${stats.total_hosts} hosts`} />
      <KpiCard label="Active listings" value={String(stats.total_listings)} hint="published" />
      <KpiCard label="Bookings (30d)" value={String(stats.bookings_30d)} hint="confirmed + completed" />
      <KpiCard
        label="GMV (30d)"
        value={formatPrice(stats.gmv_30d_cents, stats.gmv_currency)}
        hint="gross"
      />
      <KpiCard
        label="Avg rating"
        value={stats.avg_rating.toFixed(2)}
        hint="across all stays"
      />
      <KpiCard
        label="Open incidents"
        value={String(stats.active_incidents)}
        hint={`${stats.pending_moderation} mod queue`}
      />
    </View>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="flex-1 min-w-[180px] p-5">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Heading level={2} className="mt-2">
        {value}
      </Heading>
      <Text variant="small" className="text-ink-soft mt-1">
        {hint}
      </Text>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function RecentBookings({
  bookings,
  onPressListing,
}: {
  bookings: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['recent_bookings'];
  onPressListing: (id: string) => void;
}) {
  if (bookings.length === 0) {
    return (
      <Card className="mt-3 p-6 items-center">
        <Text className="text-ink-soft">No bookings yet.</Text>
      </Card>
    );
  }
  return (
    <VStack className="mt-3 gap-2">
      {bookings.map((b) => (
        <Pressable key={b.id} onPress={() => onPressListing(b.listing_id)}>
          <Card className="px-4 py-3">
            <HStack className="gap-3 items-center">
              <Avatar src={b.guest_avatar} name={b.guest_name} size={32} />
              <VStack className="flex-1 gap-0.5">
                <HStack className="gap-2 items-center">
                  <Text className="font-semibold flex-1" numberOfLines={1}>
                    {b.listing_title}
                  </Text>
                  <Badge
                    variant={
                      b.status === 'cancelled'
                        ? 'neutral'
                        : b.status === 'completed'
                          ? 'neutral'
                          : b.status === 'in_stay'
                            ? 'brand'
                            : 'dark'
                    }
                  >
                    {b.status}
                  </Badge>
                </HStack>
                <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                  {b.guest_name} · {b.listing_city} · {formatDateRange(b.start_date, b.end_date)}
                </Text>
              </VStack>
              <Text className="font-semibold">{formatPrice(b.total_cents, b.currency)}</Text>
            </HStack>
          </Card>
        </Pressable>
      ))}
    </VStack>
  );
}

// ---------------------------------------------------------------------------

function ModerationQueue({
  items,
}: {
  items: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['moderation'];
}) {
  if (items.length === 0) {
    return (
      <Card className="mt-3 p-6 items-center">
        <Text className="text-ink-soft">Inbox zero. Nothing to review.</Text>
      </Card>
    );
  }
  return (
    <VStack className="mt-3 gap-2">
      {items.map((m) => (
        <Card key={m.id} className="px-4 py-3">
          <HStack className="gap-3 items-start">
            <View className="h-10 w-10 rounded-xl bg-surface-alt items-center justify-center mt-0.5">
              <Text className="font-bold">!</Text>
            </View>
            <VStack className="flex-1 gap-0.5">
              <HStack className="gap-2 items-center">
                <Text className="font-semibold flex-1" numberOfLines={1}>
                  {m.listing_title}
                </Text>
                <Badge variant={m.state === 'in_review' ? 'brand' : 'dark'}>
                  {m.state.replace('_', ' ')}
                </Badge>
              </HStack>
              <Text variant="small" className="text-ink-soft">
                {m.listing_city} · {m.reason}
              </Text>
              <Text variant="caption" className="mt-0.5">
                Submitted {m.submitted_at}
              </Text>
            </VStack>
          </HStack>
        </Card>
      ))}
    </VStack>
  );
}

// ---------------------------------------------------------------------------

function SystemHealth({
  health,
}: {
  health: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['health'];
}) {
  const rows: Array<{ label: string; value: string; ok: boolean }> = [
    { label: 'API latency P95',    value: `${health.api_p95_ms} ms`,                ok: health.api_p95_ms < 300 },
    { label: 'Search latency P95', value: `${health.search_p95_ms} ms`,             ok: health.search_p95_ms < 300 },
    { label: 'Email delivery',     value: `${health.email_deliverability_pct}%`,    ok: health.email_deliverability_pct >= 99 },
    { label: 'Push delivery',      value: `${health.push_deliverability_pct}%`,     ok: health.push_deliverability_pct >= 98 },
    { label: 'Job queue depth',    value: String(health.jobs_queue_depth),          ok: health.jobs_queue_depth < 50 },
    { label: 'Webhook lag',        value: `${health.webhook_lag_seconds}s`,         ok: health.webhook_lag_seconds < 10 },
    { label: 'Uptime (30d)',       value: `${health.uptime_30d_pct}%`,              ok: health.uptime_30d_pct >= 99.9 },
  ];
  return (
    <Card className="mt-3 p-5">
      <VStack className="gap-3">
        {rows.map((r, i) => (
          <View key={r.label}>
            <HStack className="justify-between gap-3">
              <HStack className="gap-2 items-center flex-1">
                <View
                  className={`h-2 w-2 rounded-full ${r.ok ? 'bg-[#2E7D5B]' : 'bg-[#B4432F]'}`}
                />
                <Text variant="small" className="text-ink-soft">
                  {r.label}
                </Text>
              </HStack>
              <Text className="font-semibold">{r.value}</Text>
            </HStack>
            {i < rows.length - 1 ? <Divider className="mt-3" /> : null}
          </View>
        ))}
      </VStack>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function AuditFeed({
  entries,
}: {
  entries: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['audit'];
}) {
  return (
    <VStack className="mt-3 gap-2">
      {entries.map((e) => (
        <Card key={e.id} className="px-4 py-3">
          <VStack className="gap-0.5">
            <HStack className="gap-2 items-center">
              <Text className="font-semibold" numberOfLines={1}>
                {e.action.replace(/_/g, ' ')}
              </Text>
              <Badge variant="neutral">{e.reason_code}</Badge>
            </HStack>
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>
              {e.actor} → {e.target}
            </Text>
            <Text variant="caption">{e.created_at}</Text>
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}

// ---------------------------------------------------------------------------

function UsersTable({
  users,
}: {
  users: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['users'];
}) {
  return (
    <Card className="mt-3 p-0 overflow-hidden">
      <View className="hidden md:flex md:flex-row md:px-5 md:py-3 md:bg-surface-alt md:border-b md:border-surface-border">
        <Text variant="label" className="flex-[2]">User</Text>
        <Text variant="label" className="flex-1">Role</Text>
        <Text variant="label" className="flex-1">Joined</Text>
        <Text variant="label" className="flex-1">Bookings</Text>
        <Text variant="label" className="flex-1 text-right">Status</Text>
      </View>
      {users.map((u, i) => (
        <View
          key={u.id}
          className={`px-4 py-3 md:px-5 md:flex-row md:items-center ${i < users.length - 1 ? 'border-b border-surface-border' : ''}`}
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
      ))}
    </Card>
  );
}

// ---------------------------------------------------------------------------

function KpiSkeletons() {
  return (
    <View className="mt-6 flex-row flex-wrap gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28 flex-1 min-w-[180px]" />
      ))}
    </View>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <VStack className="mt-3 gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </VStack>
  );
}
