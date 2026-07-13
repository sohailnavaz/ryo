'use client';

import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  flattenList,
  newIdempotencyKey,
  previewAdminAction,
  useAdminUserList,
  useAdminViews,
  useReasonCodes,
  useRole,
  useRunAdminAction,
  type AdminUserRow,
  type UserSegment,
  type UserSortField,
} from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  HStack,
  Input,
  Pressable,
  ReasonCodeModal,
  Text,
  VStack,
  toast,
  type Column,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { AdminShell } from './shell';

// The users surface, rebuilt on the Phase-1 list primitive.
// (docs/15-admin-console.md §3)
//
// What changed, and why it matters more than it looks:
//
//   Before — fetched EVERY user, filtered in the browser, mounted every row, and
//   called itself "Every account on file". That is a database browser. It dies at
//   50,000 rows, and worse, its default view answered a question nobody asks.
//
//   Now — the front door is a set of SEGMENTS ("who's about to churn", "did we get
//   this week's suspensions right"). Rows are keyset-paginated and virtualized, the
//   server does all filtering and sorting, facets carry counts, emails are masked
//   until an admin unmasks (which is recorded), and bulk actions preview their blast
//   radius before they run.

const BULK_CAP = 50;

export function AdminUsersScreen() {
  const router = useRouter();
  const { role } = useRole();
  const isAdmin = role === 'admin';

  const [segment, setSegment] = useState<UserSegment>('suspended_recent');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ field: UserSortField; dir: 'asc' | 'desc' }>({
    field: 'created_at',
    dir: 'desc',
  });
  const [filters, setFilters] = useState<{ role?: string[]; status?: string[] }>({});
  const [unmask, setUnmask] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRadius, setBulkRadius] = useState<string | null>(null);

  const { data: views } = useAdminViews('users');
  const { data: reasons } = useReasonCodes('user');
  const runAction = useRunAdminAction();

  const list = useAdminUserList({ segment, q, filters, sort: sort.field, dir: sort.dir, limit: 50, unmask });
  const { rows, facets, total, totalIsEstimate } = useMemo(
    () => flattenList<AdminUserRow>(list.data?.pages),
    [list.data],
  );

  const activeView = views?.find((v) => v.definition.segment === segment);

  function applyView(key: string) {
    const v = views?.find((x) => x.key === key);
    if (!v) return;
    setSelectedIds([]);
    setSegment((v.definition.segment as UserSegment) ?? 'all');
    if (v.definition.sort) setSort({ field: v.definition.sort as UserSortField, dir: 'desc' });
  }

  function toggleFacet(kind: 'role' | 'status', value: string) {
    setSelectedIds([]);
    setFilters((f) => {
      const cur = f[kind] ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      const out = { ...f, [kind]: next };
      if (next.length === 0) delete out[kind];
      return out;
    });
  }

  function onSort(field: string) {
    setSelectedIds([]);
    setSort((s) =>
      s.field === field
        ? { field: s.field, dir: s.dir === 'desc' ? 'asc' : 'desc' }
        : { field: field as UserSortField, dir: 'desc' },
    );
  }

  // Bulk suspend: ask the server what this WOULD do, aggregate it, and show the
  // operator the real cost before they commit. This is the whole difference between
  // a considered decision and a click.
  async function openBulkSuspend() {
    const targets = selectedIds.slice(0, BULK_CAP);
    try {
      const previews = await Promise.all(
        targets.map((id) =>
          previewAdminAction({ action: 'user.suspend', subjectType: 'user', subjectId: id }),
        ),
      );
      const bookings = previews.reduce((n, p) => n + (p.blast_radius?.upcoming_bookings ?? 0), 0);
      const value = previews.reduce(
        (n, p) => n + (p.blast_radius?.upcoming_booking_value_cents ?? 0),
        0,
      );
      const guests = previews.reduce((n, p) => n + (p.blast_radius?.guests_notified ?? 0), 0);

      setBulkRadius(
        `Suspends ${targets.length} ${targets.length === 1 ? 'account' : 'accounts'}. ` +
          `${bookings} upcoming ${bookings === 1 ? 'booking' : 'bookings'} worth ` +
          `${(value / 100).toLocaleString(undefined, { style: 'currency', currency: 'INR' })} ` +
          `at risk · ${guests} ${guests === 1 ? 'guest' : 'guests'} affected.`,
      );
      setBulkOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not preview that action.');
    }
  }

  async function runBulkSuspend(reason_code: string, note: string) {
    const targets = selectedIds.slice(0, BULK_CAP);
    let ok = 0;
    for (const id of targets) {
      try {
        await runAction.mutateAsync({
          action: 'user.suspend',
          subjectType: 'user',
          subjectId: id,
          reasonCode: reason_code,
          note,
          idempotencyKey: newIdempotencyKey(),
        });
        ok += 1;
      } catch {
        /* counted below */
      }
    }
    setBulkOpen(false);
    setSelectedIds([]);
    if (ok === targets.length) {
      toast.success(`Suspended ${ok} ${ok === 1 ? 'account' : 'accounts'}.`);
    } else {
      toast.warning(`Suspended ${ok} of ${targets.length}. The rest were unchanged.`);
    }
  }

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'user',
      header: 'User',
      flex: 2.4,
      render: (u) => (
        <HStack className="gap-3 items-center">
          <Avatar name={u.display_name} size={32} />
          <VStack className="flex-1 gap-0.5">
            <Text className="font-semibold" numberOfLines={1}>
              {u.display_name}
            </Text>
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>
              {u.email}
            </Text>
          </VStack>
        </HStack>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      flex: 0.9,
      desktopOnly: true,
      render: (u) => (
        <Badge variant={u.role === 'admin' || u.role === 'staff' ? 'dark' : 'neutral'}>{u.role}</Badge>
      ),
    },
    {
      key: 'bookings_count',
      header: 'Trips',
      flex: 0.7,
      desktopOnly: true,
      sortable: true,
      render: (u) => (
        <Text variant="small" className="text-ink-soft">
          {u.bookings_count}
        </Text>
      ),
    },
    {
      key: 'ltv_cents',
      header: 'Lifetime spend',
      flex: 1.1,
      desktopOnly: true,
      sortable: true,
      align: 'right',
      render: (u) => (
        <Text variant="small" className={u.ltv_cents > 0 ? 'text-ink' : 'text-ink-soft'}>
          {u.ltv_cents > 0
            ? (u.ltv_cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'INR' })
            : '—'}
        </Text>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      flex: 1,
      desktopOnly: true,
      sortable: true,
      render: (u) => (
        <Text variant="small" className="text-ink-soft">
          {new Date(u.created_at).toLocaleDateString()}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      flex: 0.9,
      align: 'right',
      render: (u) => (
        <Badge variant={u.status === 'suspended' ? 'brand' : 'neutral'}>{u.status}</Badge>
      ),
    },
  ];

  return (
    <AdminShell
      title="Users"
      subtitle={activeView?.description ?? 'Start from a segment — the raw list is the escape hatch.'}
    >
      {/* Segments — the front door */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6 -mx-1">
        <HStack className="gap-2 px-1">
          {(views ?? []).map((v) => {
            const active = v.definition.segment === segment;
            return (
              <Pressable key={v.id} onPress={() => applyView(v.key)}>
                <View
                  className={`px-3.5 py-2 rounded-full border ${
                    active ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
                  }`}
                >
                  <Text variant="small" className={active ? 'text-surface font-semibold' : 'text-ink-soft'}>
                    {v.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>

      {/* Search + count + unmask */}
      <HStack className="mt-4 gap-3 items-center flex-wrap">
        <View className="flex-1 min-w-[220px]">
          <Input
            placeholder="Search name or email — or paste a user id"
            value={q}
            onChangeText={(v) => {
              setQ(v);
              setSelectedIds([]);
            }}
          />
        </View>
        <Text variant="small" className="text-ink-soft">
          {totalIsEstimate ? `≈${total.toLocaleString()}` : total.toLocaleString()}{' '}
          {total === 1 ? 'account' : 'accounts'}
        </Text>
        {isAdmin ? (
          <Pressable onPress={() => setUnmask((u) => !u)}>
            <Badge variant={unmask ? 'brand' : 'neutral'}>{unmask ? 'PII shown' : 'PII masked'}</Badge>
          </Pressable>
        ) : null}
      </HStack>

      {/* Facet rail — counts are the value; a filter list without them makes you guess */}
      <HStack className="mt-3 gap-2 flex-wrap">
        {(['active', 'suspended'] as const).map((s) => {
          const n = facets.status?.[s] ?? 0;
          const on = filters.status?.includes(s) ?? false;
          return (
            <Pressable key={s} onPress={() => toggleFacet('status', s)}>
              <View
                className={`px-3 py-1.5 rounded-lg border ${
                  on ? 'bg-brand-50 border-brand-500' : 'bg-surface border-surface-border'
                }`}
              >
                <Text variant="small" className={on ? 'text-brand-700' : 'text-ink-soft'}>
                  {s} · {n}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {(['guest', 'host', 'staff', 'admin'] as const).map((r) => {
          const n = facets.role?.[r] ?? 0;
          if (n === 0 && !(filters.role?.includes(r) ?? false)) return null;
          const on = filters.role?.includes(r) ?? false;
          return (
            <Pressable key={r} onPress={() => toggleFacet('role', r)}>
              <View
                className={`px-3 py-1.5 rounded-lg border ${
                  on ? 'bg-brand-50 border-brand-500' : 'bg-surface border-surface-border'
                }`}
              >
                <Text variant="small" className={on ? 'text-brand-700' : 'text-ink-soft'}>
                  {r} · {n}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </HStack>

      {/* Bulk bar — capped, and it shows what it would cost before it runs */}
      {selectedIds.length > 0 ? (
        <Card className="mt-4 p-3 flex-row items-center justify-between bg-surface-alt">
          <Text variant="small">
            {selectedIds.length} selected
            {selectedIds.length > BULK_CAP ? ` · only the first ${BULK_CAP} will be actioned` : ''}
          </Text>
          <HStack className="gap-2">
            <Button variant="ghost" size="sm" onPress={() => setSelectedIds([])}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onPress={openBulkSuspend}>
              Suspend…
            </Button>
          </HStack>
        </Card>
      ) : null}

      <View className="mt-4">
        <DataTable<AdminUserRow>
          columns={columns}
          rows={rows}
          rowKey={(u) => u.id}
          onRowPress={(u) => router.push(`/admin/users/${u.id}`)}
          loading={list.isLoading}
          loadingMore={list.isFetchingNextPage}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
          }}
          sort={sort}
          onSort={onSort}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
          }
          onSelectPage={(ids) =>
            setSelectedIds((s) => (ids.every((i) => s.includes(i)) ? [] : Array.from(new Set([...s, ...ids]))))
          }
          emptyTitle="Nobody here"
          emptyMessage={
            q
              ? `No account matches “${q}” in this segment.`
              : 'This segment is empty — which is usually good news.'
          }
        />
      </View>

      <ReasonCodeModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSubmit={({ reason_code, note }) => runBulkSuspend(reason_code, note)}
        title="Suspend these accounts?"
        message={bulkRadius ?? undefined}
        reasonCodes={(reasons ?? []).map((r) => ({ code: r.code, label: r.label }))}
        confirmLabel="Suspend"
        destructive
        loading={runAction.isPending}
      />
    </AdminShell>
  );
}
