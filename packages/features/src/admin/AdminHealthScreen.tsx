import { View } from 'react-native';
import { useAdminDashboard } from '@bnb/api';
import {
  Badge,
  Card,
  Divider,
  Heading,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { AdminShell } from './shell';

const RELEASES = [
  { sha: '8d14d1b', title: 'feat(auth): demo Continue as Mira path', when: '2026-05-11 14:08' },
  { sha: 'caa1343', title: 'feat(m9): production blockers — booking race, error UX', when: '2026-05-11 13:46' },
  { sha: 'e52f5bc', title: 'feat(deploy+ux): vercel + profile edit + booking cancel + Google OAuth', when: '2026-05-11 11:22' },
  { sha: '71a8bad', title: 'fix(security): bump next 15.1.3 → 15.5.18', when: '2026-05-11 09:58' },
  { sha: 'cd92349', title: 'chore: nudge vercel to redeploy from latest main', when: '2026-05-11 09:42' },
];

const MAINTENANCE = [
  {
    title: 'Database upgrade — Postgres 15 → 16',
    when: '2026-05-19 02:00 UTC',
    duration: '~15 min read-only',
  },
];

export function AdminHealthScreen() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <AdminShell
      title="System health"
      subtitle="Latency, deliverability, queue depth. Plus recent releases and planned maintenance."
    >
      {isLoading || !data ? (
        <Skeleton className="mt-6 h-[400px] w-full" />
      ) : (
        <View className="mt-6 flex-col md:flex-row gap-6">
          <View className="flex-1">
            <Heading level={2}>Live signals</Heading>
            <Card className="mt-3 p-5">
              <VStack className="gap-3">
                {healthRows(data.health).map((r, i) => (
                  <View key={r.label}>
                    <HStack className="justify-between gap-3">
                      <HStack className="gap-2 items-center flex-1">
                        <View
                          className={`h-2 w-2 rounded-full ${r.ok ? 'bg-[#2E7D5B]' : 'bg-[#B4432F]'}`}
                        />
                        <Text variant="small" className="text-ink-soft">{r.label}</Text>
                      </HStack>
                      <Text className="font-semibold">{r.value}</Text>
                    </HStack>
                    {i < 6 ? <Divider className="mt-3" /> : null}
                  </View>
                ))}
              </VStack>
            </Card>
          </View>

          <View className="md:w-[420px] gap-6">
            <View>
              <Heading level={2}>Recent releases</Heading>
              <Card className="mt-3 p-5">
                <VStack className="gap-3">
                  {RELEASES.map((r, i) => (
                    <View key={r.sha}>
                      <HStack className="gap-2 items-center">
                        <Badge variant="neutral">{r.sha}</Badge>
                        <Text variant="small" className="flex-1" numberOfLines={1}>
                          {r.title}
                        </Text>
                      </HStack>
                      <Text variant="caption" className="text-ink-soft mt-0.5 ml-1">
                        {r.when}
                      </Text>
                      {i < RELEASES.length - 1 ? <Divider className="mt-3" /> : null}
                    </View>
                  ))}
                </VStack>
              </Card>
            </View>

            <View>
              <Heading level={2}>Maintenance windows</Heading>
              <Card className="mt-3 p-5">
                <VStack className="gap-3">
                  {MAINTENANCE.map((m) => (
                    <View key={m.title}>
                      <Text className="font-semibold">{m.title}</Text>
                      <Text variant="small" className="text-ink-soft mt-0.5">
                        {m.when} · {m.duration}
                      </Text>
                    </View>
                  ))}
                </VStack>
              </Card>
            </View>
          </View>
        </View>
      )}
    </AdminShell>
  );
}

function healthRows(h: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['health']) {
  return [
    { label: 'API latency P95',    value: `${h.api_p95_ms} ms`,                ok: h.api_p95_ms < 300 },
    { label: 'Search latency P95', value: `${h.search_p95_ms} ms`,             ok: h.search_p95_ms < 300 },
    { label: 'Email delivery',     value: `${h.email_deliverability_pct}%`,    ok: h.email_deliverability_pct >= 99 },
    { label: 'Push delivery',      value: `${h.push_deliverability_pct}%`,     ok: h.push_deliverability_pct >= 98 },
    { label: 'Job queue depth',    value: String(h.jobs_queue_depth),          ok: h.jobs_queue_depth < 50 },
    { label: 'Webhook lag',        value: `${h.webhook_lag_seconds}s`,         ok: h.webhook_lag_seconds < 10 },
    { label: 'Uptime (30d)',       value: `${h.uptime_30d_pct}%`,              ok: h.uptime_30d_pct >= 99.9 },
  ];
}
