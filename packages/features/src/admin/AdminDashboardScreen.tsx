import { View } from 'react-native';
import {
  incidentSla,
  useAdminDashboard,
  useAdminIncidents,
  useAdminOverrides,
  // useAdminHostApplications is built by the host-application agent and
  // re-exported from @bnb/api. Until the index.ts export lands this name won't
  // resolve under typecheck — expected, noted in the handoff.
  useAdminHostApplications,
} from '@bnb/api';
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
import { SectionHeader } from '../shared/dashboard-chrome';
import { AdminShell } from './shell';

// Flagged-review queue is currently seeded inside the moderation screen (2 items).
// Mirror that here so the "needs attention" count is honest until reviews move
// behind a hook.
const SEEDED_FLAGGED_REVIEW_IDS = ['r-101', 'r-102'];

export function AdminDashboardScreen() {
  const router = useRouter();
  const { data, isLoading } = useAdminDashboard();
  const { data: incidents } = useAdminIncidents();
  const pendingApps = useAdminHostApplications('pending');
  const overrides = useAdminOverrides();

  const flaggedReviews = SEEDED_FLAGGED_REVIEW_IDS.filter(
    (id) => !overrides.reviewModeration[id],
  ).length;

  // Incident SLA roll-up. AdminIncident carries only `opened_at`; anchor the
  // clock at 09:00 on that day, matching the incidents screen.
  const openIncidents = (incidents ?? []).filter((i) => i.state !== 'resolved');
  const breachedIncidents = openIncidents.filter(
    (i) =>
      incidentSla({
        tier: i.tier,
        created_at: `${i.opened_at}T09:00:00Z`,
        status: i.state,
      }).state === 'breached',
  ).length;

  const pendingAppsCount = pendingApps.data?.length ?? 0;
  const moderationCount = data?.moderation.length ?? 0;

  return (
    <AdminShell
      title="Platform overview"
      subtitle="What's moving across Ryo right now, and what needs a human. All numbers refresh on page load."
    >
      {isLoading || !data ? (
        <KpiSkeletons />
      ) : (
        <KpiBand
          stats={data.stats}
          openIncidents={openIncidents.length}
          breachedIncidents={breachedIncidents}
          pendingApps={pendingAppsCount}
          flaggedReviews={flaggedReviews}
        />
      )}

      <View className="mt-10">
        <SectionHeader
          title="Needs attention"
          subtitle="Actionable queues, highest urgency first. Click through to act."
        />
        {isLoading || !data ? (
          <View className="mt-3 flex-row flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 flex-1 min-w-[240px]" />
            ))}
          </View>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-4">
            <AttentionCard
              label="Incidents due / breached"
              count={openIncidents.length}
              detail={
                breachedIncidents > 0
                  ? `${breachedIncidents} past SLA — act now`
                  : 'All open incidents on track'
              }
              urgent={breachedIncidents > 0}
              onPress={() => router.push('/admin/incidents')}
            />
            <AttentionCard
              label="Host applications"
              count={pendingAppsCount}
              detail={
                pendingApps.isError
                  ? 'Service unavailable'
                  : pendingAppsCount > 0
                    ? 'Awaiting your review'
                    : 'Queue is clear'
              }
              urgent={pendingAppsCount > 0}
              onPress={() => router.push('/admin/host-applications')}
            />
            <AttentionCard
              label="Listings awaiting moderation"
              count={moderationCount}
              detail={moderationCount > 0 ? 'Pending a decision' : 'Inbox zero'}
              urgent={false}
              onPress={() => router.push('/admin/moderation')}
            />
            <AttentionCard
              label="Flagged reviews"
              count={flaggedReviews}
              detail={flaggedReviews > 0 ? 'Reported by guests/hosts' : 'Nothing flagged'}
              urgent={false}
              onPress={() => router.push('/admin/moderation')}
            />
          </View>
        )}
      </View>

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
                onPressBooking={(id) => router.push(`/admin/bookings/${id}`)}
              />
            )}
          </View>

          <View>
            <SectionHeader
              title="Moderation queue"
              subtitle={`${moderationCount} listings awaiting decision`}
            />
            {isLoading || !data ? (
              <ListSkeleton rows={3} />
            ) : (
              <ModerationQueue items={data.moderation} onPress={() => router.push('/admin/moderation')} />
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
      {isLoading || !data ? (
        <ListSkeleton rows={5} />
      ) : (
        <UsersTable
          users={data.users}
          onPress={(id) => router.push(`/admin/users/${id}`)}
        />
      )}
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------
// KPI band — meaningful numbers with context.
// ---------------------------------------------------------------------------

function KpiBand({
  stats,
  openIncidents,
  breachedIncidents,
  pendingApps,
  flaggedReviews,
}: {
  stats: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['stats'];
  openIncidents: number;
  breachedIncidents: number;
  pendingApps: number;
  flaggedReviews: number;
}) {
  return (
    <View className="mt-6 flex-row flex-wrap gap-4">
      <KpiCard
        label="GMV · 30d"
        value={formatPrice(stats.gmv_30d_cents, stats.gmv_currency)}
        hint={`${stats.bookings_30d} bookings`}
      />
      <KpiCard
        label="Bookings · 30d"
        value={String(stats.bookings_30d)}
        hint="confirmed + completed"
      />
      <KpiCard
        label="Active listings"
        value={String(stats.total_listings)}
        hint={`${stats.total_hosts} hosts · ${stats.total_users} users`}
      />
      <KpiCard
        label="Host applications"
        value={String(pendingApps)}
        hint="pending review"
        tone={pendingApps > 0 ? 'warn' : 'ok'}
      />
      <KpiCard
        label="Open incidents"
        value={String(openIncidents)}
        hint={
          breachedIncidents > 0
            ? `${breachedIncidents} past SLA`
            : 'all on track'
        }
        tone={breachedIncidents > 0 ? 'alert' : openIncidents > 0 ? 'warn' : 'ok'}
      />
      <KpiCard
        label="Flagged reviews"
        value={String(flaggedReviews)}
        hint={`${stats.pending_moderation} listings in mod`}
        tone={flaggedReviews > 0 ? 'warn' : 'ok'}
      />
    </View>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'alert';
}) {
  const dot =
    tone === 'alert'
      ? 'bg-[#B4432F]'
      : tone === 'warn'
        ? 'bg-brand-500'
        : tone === 'ok'
          ? 'bg-[#2E7D5B]'
          : 'bg-transparent';
  return (
    <Card className="flex-1 min-w-[180px] p-5">
      <HStack className="items-center gap-2">
        {tone !== 'neutral' ? <View className={`h-2 w-2 rounded-full ${dot}`} /> : null}
        <Text variant="small" className="text-ink-soft">
          {label}
        </Text>
      </HStack>
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

function AttentionCard({
  label,
  count,
  detail,
  urgent,
  onPress,
}: {
  label: string;
  count: number;
  detail: string;
  urgent: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 min-w-[240px]">
      <Card className={`p-5 ${urgent ? 'border-2 border-brand-500' : ''}`}>
        <HStack className="items-start justify-between gap-3">
          <VStack className="flex-1 gap-1">
            <Text className="font-semibold">{label}</Text>
            <Text variant="small" className="text-ink-soft">
              {detail}
            </Text>
          </VStack>
          <Badge variant={urgent ? 'brand' : count > 0 ? 'dark' : 'neutral'}>
            {count}
          </Badge>
        </HStack>
        <Text variant="small" className="text-ink-soft mt-3 underline">
          Open queue →
        </Text>
      </Card>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

function RecentBookings({
  bookings,
  onPressBooking,
}: {
  bookings: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['recent_bookings'];
  onPressBooking: (id: string) => void;
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
        <Pressable key={b.id} onPress={() => onPressBooking(b.id)}>
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
  onPress,
}: {
  items: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['moderation'];
  onPress: () => void;
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
        <Pressable key={m.id} onPress={onPress}>
          <Card className="px-4 py-3">
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
        </Pressable>
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
  onPress,
}: {
  users: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['users'];
  onPress: (id: string) => void;
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
        <Pressable key={u.id} onPress={() => onPress(u.id)}>
          <View
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
        </Pressable>
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
