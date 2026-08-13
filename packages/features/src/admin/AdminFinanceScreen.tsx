'use client';

import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  useAddExpense,
  useExpenses,
  useLedgerAccounts,
  useProfitAndLoss,
  useRecognizeRevenue,
  useRecurringExpenses,
  useAddRecurringExpense,
  useRunRecurring,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Input,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

// Finance. (docs/15-admin-console.md §6, Phase 3)
//
// This screen used to be a synthetic GMV chart. GMV is a vanity number: it is what
// GUESTS paid, most of which is the host's money passing through us. It says nothing
// about whether the business works.
//
// What replaces it is a real P&L, computed from a double-entry ledger:
//
//     GMV                     ← what guests paid
//       less host payouts     ← PASS-THROUGH. never ours.
//     = NET REVENUE           ← what Ryo actually earns (guest fee + host fee)
//       less variable costs   ← processing, refunds, concierge, guarantee claims
//     = CONTRIBUTION MARGIN   ← the line that says whether the business works
//       less fixed costs      ← salaries, marketing, infra, legal
//     = OPERATING PROFIT
//
// Revenue derives from real bookings and is recognised at CHECK-IN, not at booking.
// Costs are entered below. Escrow float is shown separately and never summed into
// revenue — it is money we hold, not money we have.

type Tab = 'pl' | 'expenditure';

function monthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AdminFinanceScreen() {
  const [tab, setTab] = useState<Tab>('pl');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());

  const { data: pl, isLoading } = useProfitAndLoss(from, to);
  const recognize = useRecognizeRevenue();

  const cur = 'INR';
  const money = (c: number | undefined) => formatPrice(c ?? 0, cur);

  return (
    <AdminShell
      title="Finance"
      subtitle="Revenue derives from real bookings. Costs are entered. Both live in one ledger."
    >
      <HStack className="mt-6 gap-2">
        {(['pl', 'expenditure'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)}>
            <View
              className={`px-3.5 py-2 rounded-full border ${
                tab === t ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
              }`}
            >
              <Text variant="small" className={tab === t ? 'text-surface font-semibold' : 'text-ink-soft'}>
                {t === 'pl' ? 'Profit & loss' : 'Expenditure'}
              </Text>
            </View>
          </Pressable>
        ))}
      </HStack>

      <HStack className="mt-4 gap-3 items-end flex-wrap">
        <View className="w-[150px]">
          <Input label="From" value={from} onChangeText={setFrom} />
        </View>
        <View className="w-[150px]">
          <Input label="To" value={to} onChangeText={setTo} />
        </View>
        <Button
          variant="outline"
          size="sm"
          loading={recognize.isPending}
          onPress={() =>
            recognize.mutate(undefined, {
              onSuccess: (n) =>
                toast.success(
                  n === 0
                    ? 'Nothing new to recognise — every started stay is already booked to revenue.'
                    : `Recognised revenue on ${n} ${n === 1 ? 'stay' : 'stays'}.`,
                ),
              onError: (e) => toast.error(e.message),
            })
          }
        >
          Recognise revenue
        </Button>
      </HStack>

      {isLoading || !pl ? (
        <Skeleton className="mt-6 h-96 w-full" />
      ) : tab === 'pl' ? (
        <>
          {/* The P&L */}
          <Card className="mt-5 p-5">
            <Text variant="label" className="mb-3">
              Profit & loss
            </Text>

            <Row label="GMV — what guests paid" value={money(pl.gmv)} muted />
            <Row
              label="less: host payouts (never ours)"
              value={`(${money(pl.host_payouts)})`}
              muted
            />
            <Row
              label="less: taxes collected (owed to the state)"
              value={`(${money(pl.taxes_collected)})`}
              muted
            />
            <Divider className="my-2" />
            <Row label="NET REVENUE" value={money(pl.net_revenue)} bold />
            <Text variant="small" className="text-ink-soft mb-3">
              Guest fee + host fee · take rate {(pl.take_rate_bps / 100).toFixed(1)}%
            </Text>

            <Row label="less: variable costs" value={`(${money(pl.variable_costs)})`} muted />
            <Divider className="my-2" />
            <Row
              label="CONTRIBUTION MARGIN"
              value={money(pl.contribution_margin)}
              bold
              negative={pl.contribution_margin < 0}
            />
            <Text variant="small" className="text-ink-soft mb-3">
              {pl.net_revenue > 0
                ? `${Math.round((pl.contribution_margin / pl.net_revenue) * 100)}% of net revenue · this is the line that says whether the business works`
                : 'No revenue recognised in this window.'}
            </Text>

            <Row label="less: fixed costs" value={`(${money(pl.fixed_costs)})`} muted />
            <Divider className="my-2" />
            <Row
              label="OPERATING PROFIT"
              value={money(pl.operating_profit)}
              bold
              negative={pl.operating_profit < 0}
            />
          </Card>

          {/* What we hold but have not earned */}
          <Card className="mt-4 p-5">
            <Text variant="label" className="mb-1">
              Held, not earned
            </Text>
            <Text variant="small" className="text-ink-soft mb-3">
              Money on our books that is not ours. It is never counted as revenue.
            </Text>
            <Row label="Escrow float (collected, not yet paid to hosts)" value={money(pl.escrow_float)} />
            <Row label="Deferred revenue (fees on stays not yet started)" value={money(pl.deferred_revenue)} />
          </Card>

          {/* Unit economics */}
          <Card className="mt-4 p-5">
            <Text variant="label" className="mb-3">
              Unit economics
            </Text>
            <HStack className="gap-8 flex-wrap">
              <Stat label="Bookings" value={String(pl.bookings)} />
              <Stat label="Net revenue / booking" value={money(pl.arpb)} />
              <Stat label="Variable cost / booking" value={money(pl.variable_per_booking)} />
              <Stat
                label="Contribution / booking"
                value={money(pl.cm_per_booking)}
                negative={pl.cm_per_booking < 0}
              />
              <Stat label="New users" value={String(pl.new_users)} />
              <Stat label="Blended CAC" value={money(pl.blended_cac)} />
            </HStack>
            {pl.cm_per_booking < 0 && pl.bookings > 0 ? (
              <Text variant="small" className="text-brand-700 mt-3">
                Every booking currently loses money before a single fixed cost is paid.
              </Text>
            ) : null}
          </Card>

          {/* Where every number came from */}
          <Card className="mt-4 p-0 overflow-hidden">
            <View className="px-5 py-3 bg-surface-alt border-b border-surface-border">
              <Text variant="label">Ledger detail · budget vs actual</Text>
            </View>
            {pl.lines.length === 0 ? (
              <View className="p-8 items-center">
                <Text variant="small" className="text-ink-soft">
                  No ledger movement in this window.
                </Text>
              </View>
            ) : (
              pl.lines.map((l, i) => {
                const over = l.budget_cents > 0 && l.actual_cents > l.budget_cents;
                return (
                  <View
                    key={l.code}
                    className={`px-5 py-3 flex-row items-center justify-between ${
                      i === pl.lines.length - 1 ? '' : 'border-b border-surface-border'
                    }`}
                  >
                    <VStack className="flex-1 gap-0.5">
                      <HStack className="gap-2 items-center flex-wrap">
                        <Text variant="small" className="font-medium">
                          {l.name}
                        </Text>
                        <Badge variant="neutral">{l.code}</Badge>
                        {l.kind === 'expense' ? (
                          <Badge variant="neutral">{l.is_variable ? 'variable' : 'fixed'}</Badge>
                        ) : null}
                        {over ? <Badge variant="brand">over budget</Badge> : null}
                      </HStack>
                      {l.budget_cents > 0 ? (
                        <Text variant="small" className="text-ink-soft">
                          Budget {money(l.budget_cents)}
                        </Text>
                      ) : null}
                    </VStack>
                    <Text variant="small" className="font-medium">
                      {money(l.actual_cents)}
                    </Text>
                  </View>
                );
              })
            )}
          </Card>
        </>
      ) : (
        <ExpenditureTab from={from} to={to} />
      )}
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------

function ExpenditureTab({ from, to }: { from: string; to: string }) {
  const { data: accounts } = useLedgerAccounts();
  const { data: expenses, isLoading } = useExpenses(from, to);
  const { data: recurring } = useRecurringExpenses();
  const addExpense = useAddExpense();
  const addRecurring = useAddRecurringExpense();
  const runRecurring = useRunRecurring();

  const [account, setAccount] = useState('');
  const [vendor, setVendor] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [isRecurring, setIsRecurring] = useState(false);

  const total = useMemo(
    () => (expenses ?? []).reduce((n, e) => n + e.amount_cents, 0),
    [expenses],
  );

  function submit() {
    const rupees = Number(amount);
    if (!account) return toast.error('Pick a cost centre.');
    if (!Number.isFinite(rupees) || rupees <= 0) return toast.error('Enter an amount.');
    const cents = Math.round(rupees * 100);

    const onDone = () => {
      toast.success(isRecurring ? 'Recurring cost added and applied.' : 'Expense recorded.');
      setVendor('');
      setDesc('');
      setAmount('');
    };
    const onFail = (e: Error) => toast.error(e.message);

    if (isRecurring) {
      addRecurring.mutate(
        { account_code: account, vendor, description: desc, amount_cents: cents, starts_on: date },
        { onSuccess: onDone, onError: onFail },
      );
    } else {
      addExpense.mutate(
        { incurred_on: date, account_code: account, vendor, description: desc, amount_cents: cents },
        { onSuccess: onDone, onError: onFail },
      );
    }
  }

  return (
    <>
      <Card className="mt-5 p-5">
        <Text variant="label" className="mb-1">
          Record a cost
        </Text>
        <Text variant="small" className="text-ink-soft mb-4">
          Marketing, salaries, infrastructure, host-side costs. Every entry posts a balanced
          journal to the ledger — which is why the P&L can never disagree with this page.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          <HStack className="gap-2 px-1 pb-3">
            {(accounts ?? []).map((a) => (
              <Pressable key={a.code} onPress={() => setAccount(a.code)}>
                <View
                  className={`px-3 py-2 rounded-lg border ${
                    account === a.code ? 'bg-brand-50 border-brand-500' : 'bg-surface border-surface-border'
                  }`}
                >
                  <Text variant="small" className={account === a.code ? 'text-brand-700' : 'text-ink-soft'}>
                    {a.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>

        <HStack className="gap-3 flex-wrap items-end">
          <View className="w-[150px]">
            <Input label="Date" value={date} onChangeText={setDate} />
          </View>
          <View className="w-[150px]">
            <Input
              label="Amount (₹)"
              placeholder="5000"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
          <View className="w-[170px]">
            <Input label="Vendor" value={vendor} onChangeText={setVendor} placeholder="Google Ads" />
          </View>
          <View className="flex-1 min-w-[180px]">
            <Input label="Description" value={desc} onChangeText={setDesc} placeholder="Search campaign" />
          </View>
        </HStack>

        <HStack className="mt-4 gap-3 items-center flex-wrap">
          <Pressable onPress={() => setIsRecurring((r) => !r)}>
            <Badge variant={isRecurring ? 'brand' : 'neutral'}>
              {isRecurring ? 'Repeats monthly' : 'One-off'}
            </Badge>
          </Pressable>
          <Text variant="small" className="text-ink-soft flex-1 min-w-[200px]">
            {isRecurring
              ? 'Enter salaries and subscriptions once — they materialise every month on their own.'
              : 'Tap to make this repeat monthly.'}
          </Text>
          <Button loading={addExpense.isPending || addRecurring.isPending} onPress={submit}>
            Record
          </Button>
        </HStack>
      </Card>

      {(recurring ?? []).length > 0 ? (
        <Card className="mt-4 p-5">
          <HStack className="justify-between items-center mb-3">
            <Text variant="label">Recurring costs</Text>
            <Button
              variant="ghost"
              size="sm"
              loading={runRecurring.isPending}
              onPress={() =>
                runRecurring.mutate(undefined, {
                  onSuccess: (n) =>
                    toast.success(n === 0 ? 'Already up to date.' : `Posted ${n} recurring entries.`),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Catch up
            </Button>
          </HStack>
          <VStack className="gap-2">
            {(recurring ?? []).map((r) => (
              <HStack key={r.id} className="justify-between items-center">
                <Text variant="small">
                  {r.description || r.vendor || r.account_code} · day {r.day_of_month}
                </Text>
                <Text variant="small" className="font-medium">
                  {formatPrice(r.amount_cents, 'INR')} / month
                </Text>
              </HStack>
            ))}
          </VStack>
        </Card>
      ) : null}

      <Card className="mt-4 p-0 overflow-hidden">
        <View className="px-5 py-3 bg-surface-alt border-b border-surface-border flex-row justify-between">
          <Text variant="label">Costs in this window</Text>
          <Text variant="label">{formatPrice(total, 'INR')}</Text>
        </View>
        {isLoading ? (
          <View className="p-5">
            <Skeleton className="h-24 w-full" />
          </View>
        ) : (expenses ?? []).length === 0 ? (
          <View className="p-8 items-center">
            <Text variant="small" className="text-ink-soft">
              Nothing recorded in this window.
            </Text>
          </View>
        ) : (
          (expenses ?? []).map((e, i) => (
            <View
              key={e.id}
              className={`px-5 py-3 flex-row items-center justify-between ${
                i === (expenses ?? []).length - 1 ? '' : 'border-b border-surface-border'
              }`}
            >
              <VStack className="flex-1 gap-0.5">
                <HStack className="gap-2 items-center flex-wrap">
                  <Text variant="small" className="font-medium">
                    {e.description || e.vendor || 'Expense'}
                  </Text>
                  <Badge variant="neutral">{e.account_code}</Badge>
                  {e.recurring_id ? <Badge variant="neutral">recurring</Badge> : null}
                </HStack>
                <Text variant="small" className="text-ink-soft">
                  {e.incurred_on}
                  {e.vendor ? ` · ${e.vendor}` : ''}
                </Text>
              </VStack>
              <Text variant="small">{formatPrice(e.amount_cents, e.currency)}</Text>
            </View>
          ))
        )}
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------

function Row({
  label,
  value,
  bold,
  muted,
  negative,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <HStack className="justify-between items-center py-1 gap-4">
      <Text
        variant={bold ? undefined : 'small'}
        className={bold ? 'font-semibold' : muted ? 'text-ink-soft' : ''}
      >
        {label}
      </Text>
      <Text
        variant={bold ? undefined : 'small'}
        className={`${bold ? 'font-semibold' : muted ? 'text-ink-soft' : ''} ${
          negative ? 'text-brand-700' : ''
        }`}
      >
        {value}
      </Text>
    </HStack>
  );
}

function Stat({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <VStack className="gap-0.5">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text className={`font-semibold ${negative ? 'text-brand-700' : ''}`}>{value}</Text>
    </VStack>
  );
}
