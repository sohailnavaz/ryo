import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  clearPayoutMethod,
  savePayoutMethod,
  setPayoutSchedule,
  useHostVerification,
  type PayoutMethodKind,
  type PayoutSchedule,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Input,
  Pressable,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { HostShell } from './shell';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD'];

const SCHEDULES: Array<{ key: PayoutSchedule; label: string; hint: string }> = [
  { key: 'per_booking', label: 'After each stay', hint: 'Released 24h after check-out' },
  { key: 'weekly',      label: 'Weekly',          hint: 'Every Monday' },
  { key: 'monthly',     label: 'Monthly',         hint: '1st of the month' },
];

// Synthetic statement history — stands in until real payout rails land.
const STATEMENTS = [
  { id: 'st-2026-04', period: 'April 2026',    gross: '$4,820', fees: '- $578', net: '$4,242', status: 'paid' as const },
  { id: 'st-2026-03', period: 'March 2026',    gross: '$3,910', fees: '- $469', net: '$3,441', status: 'paid' as const },
  { id: 'st-2026-02', period: 'February 2026', gross: '$2,640', fees: '- $317', net: '$2,323', status: 'paid' as const },
  { id: 'st-2026-01', period: 'January 2026',  gross: '$3,180', fees: '- $382', net: '$2,798', status: 'paid' as const },
];

const TAX_DOCS = [
  { id: 'tax-2025', label: '2025 year-end statement', region: 'US · 1099-K equivalent', ready: true },
  { id: 'tax-2026', label: '2026 year-end statement', region: 'Generated each December', ready: false },
];

export function HostPayoutsScreen() {
  const { payoutMethod, payoutSchedule } = useHostVerification();

  const [kind, setKind] = useState<PayoutMethodKind>('bank');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingCode, setRoutingCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Hydrate the form from a previously saved method.
  useEffect(() => {
    if (!payoutMethod) return;
    setKind(payoutMethod.kind);
    setAccountName(payoutMethod.account_name);
    setAccountNumber(payoutMethod.account_number ?? '');
    setRoutingCode(payoutMethod.routing_code ?? '');
    setUpiId(payoutMethod.upi_id ?? '');
    setCurrency(payoutMethod.currency);
  }, [payoutMethod]);

  const save = () => {
    if (!accountName.trim()) {
      toast.error('Add the account-holder name.');
      return;
    }
    if (kind === 'bank' && (!accountNumber.trim() || !routingCode.trim())) {
      toast.error('Add the account number and routing / IFSC code.');
      return;
    }
    if (kind === 'upi' && !upiId.trim()) {
      toast.error('Add the UPI ID.');
      return;
    }
    savePayoutMethod({
      kind,
      account_name: accountName.trim(),
      account_number: kind === 'bank' ? accountNumber.trim() : undefined,
      routing_code: kind === 'bank' ? routingCode.trim() : undefined,
      upi_id: kind === 'upi' ? upiId.trim() : undefined,
      currency,
    });
    toast.success('Payout method saved.', {
      description: 'Stored on this device only — real money rails arrive in v2.',
    });
  };

  const remove = () => {
    clearPayoutMethod();
    setAccountName('');
    setAccountNumber('');
    setRoutingCode('');
    setUpiId('');
    toast.success('Payout method removed.');
  };

  const maskedNumber = payoutMethod?.account_number
    ? `•••• ${payoutMethod.account_number.slice(-4)}`
    : undefined;

  return (
    <HostShell
      title="Payouts"
      subtitle="How and when you get paid — method, schedule, statements, and tax docs."
    >
      <View className="mt-6 flex-col md:flex-row gap-6">
      {/* Left column — method + schedule */}
      <View className="flex-1 gap-6">
        <Card className="p-5">
          <HStack className="justify-between items-center">
            <Text className="font-semibold">Payout method</Text>
            {payoutMethod ? (
              <Badge variant="dark">on file</Badge>
            ) : (
              <Badge variant="neutral">not set</Badge>
            )}
          </HStack>

          {payoutMethod ? (
            <View className="mt-3">
              <Text variant="small" className="text-ink-soft">
                {payoutMethod.kind === 'bank' ? 'Bank transfer' : 'UPI'} · {payoutMethod.currency}
              </Text>
              <Text className="mt-1 font-semibold">{payoutMethod.account_name}</Text>
              <Text variant="small" className="text-ink-soft mt-0.5">
                {payoutMethod.kind === 'bank'
                  ? `${maskedNumber} · ${payoutMethod.routing_code}`
                  : payoutMethod.upi_id}
              </Text>
              <Text variant="caption" className="text-ink-soft mt-2">
                Saved {payoutMethod.saved_at}. Editing below replaces it.
              </Text>
            </View>
          ) : null}

          <Divider className="my-4" />

          <Labeled label="Method">
            <Segmented
              options={[
                { key: 'bank', label: 'Bank transfer' },
                { key: 'upi', label: 'UPI' },
              ]}
              value={kind}
              onPick={(v) => setKind(v as PayoutMethodKind)}
            />
          </Labeled>

          <VStack className="mt-3 gap-3">
            <Labeled label="Account-holder name">
              <Input value={accountName} onChangeText={setAccountName} placeholder="As it appears on the account" />
            </Labeled>

            {kind === 'bank' ? (
              <>
                <Labeled label="Account number">
                  <Input
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="00000000"
                    keyboardType="number-pad"
                  />
                </Labeled>
                <Labeled label="Routing / IFSC / SWIFT">
                  <Input value={routingCode} onChangeText={setRoutingCode} placeholder="HDFC0001234" autoCapitalize="characters" />
                </Labeled>
              </>
            ) : (
              <Labeled label="UPI ID">
                <Input value={upiId} onChangeText={setUpiId} placeholder="host@okhdfcbank" autoCapitalize="none" />
              </Labeled>
            )}

            <Labeled label="Payout currency">
              <Segmented
                options={CURRENCIES.map((c) => ({ key: c, label: c }))}
                value={currency}
                onPick={setCurrency}
              />
            </Labeled>
          </VStack>

          <HStack className="mt-4 gap-2">
            <Button variant="secondary" onPress={save}>
              {payoutMethod ? 'Update method' : 'Save method'}
            </Button>
            {payoutMethod ? (
              <Button variant="outline" onPress={remove}>
                Remove
              </Button>
            ) : null}
          </HStack>
        </Card>

        <Card className="p-5">
          <Text className="font-semibold">Statements</Text>
          <Text variant="small" className="text-ink-soft mt-1">
            Monthly: bookings → gross → fees → net.
          </Text>
          <VStack className="mt-3 gap-3">
            {STATEMENTS.map((s, i) => (
              <View key={s.id}>
                <HStack className="justify-between items-center">
                  <VStack className="flex-1 gap-0.5">
                    <Text className="font-semibold">{s.period}</Text>
                    <Text variant="small" className="text-ink-soft">
                      {s.gross} gross · {s.fees} fees
                    </Text>
                  </VStack>
                  <VStack className="items-end gap-1">
                    <Text className="font-semibold">{s.net}</Text>
                    <Pressable onPress={() => toast.info('Preview only — would download the PDF statement.')}>
                      <Text variant="small" className="text-ink-soft underline">Download</Text>
                    </Pressable>
                  </VStack>
                </HStack>
                {i < STATEMENTS.length - 1 ? <Divider className="mt-3" /> : null}
              </View>
            ))}
          </VStack>
        </Card>
      </View>

      {/* Right column — schedule + tax */}
      <View className="md:w-[360px] gap-6">
        <Card className="p-5">
          <Text className="font-semibold">Payout schedule</Text>
          <VStack className="mt-3 gap-2">
            {SCHEDULES.map((s) => {
              const active = payoutSchedule === s.key;
              return (
                <Pressable
                  key={s.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setPayoutSchedule(s.key);
                    toast.success(`Payouts set to ${s.label.toLowerCase()}.`);
                  }}
                  className={`rounded-2xl border px-4 py-3 ${
                    active ? 'border-ink bg-surface-alt' : 'border-surface-border bg-surface'
                  }`}
                >
                  <HStack className="justify-between items-center">
                    <VStack className="gap-0.5">
                      <Text className="font-semibold">{s.label}</Text>
                      <Text variant="small" className="text-ink-soft">{s.hint}</Text>
                    </VStack>
                    {active ? <Badge variant="dark">on</Badge> : null}
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        </Card>

        <Card className="p-5">
          <Text className="font-semibold">Year-end tax documents</Text>
          <Text variant="small" className="text-ink-soft mt-1">
            1099-K equivalents per jurisdiction.
          </Text>
          <VStack className="mt-3 gap-3">
            {TAX_DOCS.map((d, i) => (
              <View key={d.id}>
                <HStack className="justify-between items-center">
                  <VStack className="flex-1 gap-0.5">
                    <Text className="font-semibold">{d.label}</Text>
                    <Text variant="small" className="text-ink-soft">{d.region}</Text>
                  </VStack>
                  {d.ready ? (
                    <Pressable onPress={() => toast.info('Preview only — opens the tax document.')}>
                      <Text variant="small" className="text-ink-soft underline">Download</Text>
                    </Pressable>
                  ) : (
                    <Badge variant="neutral">pending</Badge>
                  )}
                </HStack>
                {i < TAX_DOCS.length - 1 ? <Divider className="mt-3" /> : null}
              </View>
            ))}
          </VStack>
          <Text variant="caption" className="text-ink-soft mt-3">
            Tax-ID collection (PAN / GSTIN, W-9 / W-8) arrives with real payouts in v2.
          </Text>
        </Card>
      </View>
      </View>
    </HostShell>
  );
}

// ---------------------------------------------------------------------------

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <VStack className="gap-1">
      <Text variant="label">{label}</Text>
      {children}
    </VStack>
  );
}

function Segmented({
  options,
  value,
  onPick,
}: {
  options: Array<{ key: string; label: string }>;
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onPick(o.key)}
            className={`rounded-full border px-4 py-2 ${
              on ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
            }`}
          >
            <Text variant="small" className={on ? 'text-white font-semibold' : 'text-ink'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
