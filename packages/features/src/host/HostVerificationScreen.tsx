import { useState } from 'react';
import { View } from 'react-native';
import {
  isHostListedEligible,
  KYC_CHECK_LABELS,
  KYC_CHECK_ORDER,
  setKycStatus,
  submitKycCheck,
  useHostVerification,
  type KycCheck,
  type KycCheckType,
  type KycStatus,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Input,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { HostShell } from './shell';

// Per-check helper copy + whether the step takes a URL/stub reference.
const CHECK_META: Record<
  KycCheckType,
  { blurb: string; placeholder?: string; takesReference: boolean }
> = {
  id: {
    blurb: 'Passport, driver’s licence, or Aadhaar. Captured via our KYC partner.',
    placeholder: 'https://… link to your ID, or a reference',
    takesReference: true,
  },
  selfie: {
    blurb: 'A quick liveness selfie, matched to your ID photo. No upload to store here.',
    takesReference: false,
  },
  address: {
    blurb: 'A recent utility bill or bank statement showing your address.',
    placeholder: 'https://… link to address proof',
    takesReference: true,
  },
  property_right: {
    blurb: 'Deed, rental agreement, or property-manager authorisation.',
    placeholder: 'https://… link to ownership proof',
    takesReference: true,
  },
};

const STATUS_LABEL: Record<KycStatus, string> = {
  not_started: 'not started',
  pending: 'in review',
  verified: 'verified',
};

function statusBadgeVariant(status: KycStatus): 'neutral' | 'dark' | 'brand' {
  if (status === 'verified') return 'dark';
  if (status === 'pending') return 'brand';
  return 'neutral';
}

export function HostVerificationScreen() {
  const state = useHostVerification();
  const eligible = isHostListedEligible(state);
  const verifiedCount = KYC_CHECK_ORDER.filter((c) => state.kyc[c].status === 'verified').length;

  return (
    <HostShell
      title="Verification"
      subtitle="Vetted hosts are the heart of Ryo. Clear all four checks to be listed-eligible."
    >
      <Card className={`mt-6 p-5 ${eligible ? 'border-2 border-ink' : ''}`}>
        <HStack className="justify-between items-center">
          <VStack className="gap-1">
            <Text className="font-semibold">
              {eligible ? 'You’re listed-eligible' : 'Verification in progress'}
            </Text>
            <Text variant="small" className="text-ink-soft">
              {verifiedCount} of {KYC_CHECK_ORDER.length} checks verified
            </Text>
          </VStack>
          <Badge variant={eligible ? 'dark' : 'neutral'}>
            {eligible ? 'verified' : `${verifiedCount}/${KYC_CHECK_ORDER.length}`}
          </Badge>
        </HStack>
        {!eligible ? (
          <Text variant="caption" className="text-ink-soft mt-3">
            Listings can’t go live until every check is verified. Each step is independently
            re-verifiable if a document expires.
          </Text>
        ) : null}
      </Card>

      <VStack className="mt-6 gap-4">
        {KYC_CHECK_ORDER.map((check) => (
          <CheckRow key={check} check={check} state={state.kyc[check]} />
        ))}
      </VStack>

      <Text variant="caption" className="text-ink-soft mt-6">
        Preview only — statuses are stored on this device. A real KYC partner (ID + liveness +
        document review) replaces this in v2.
      </Text>
    </HostShell>
  );
}

// ---------------------------------------------------------------------------

function CheckRow({ check, state }: { check: KycCheckType; state: KycCheck }) {
  const meta = CHECK_META[check];
  const [reference, setReference] = useState('');

  const submit = () => {
    if (meta.takesReference && !reference.trim()) {
      toast.error('Add a link or reference first.');
      return;
    }
    submitKycCheck(check, meta.takesReference ? reference.trim() : undefined);
    toast.success(`${KYC_CHECK_LABELS[check]} submitted.`, {
      description: 'Now in review — mark it verified to simulate approval.',
    });
  };

  return (
    <Card className="p-5">
      <HStack className="justify-between items-start">
        <VStack className="flex-1 gap-1 pr-3">
          <Text className="font-semibold">{KYC_CHECK_LABELS[check]}</Text>
          <Text variant="small" className="text-ink-soft">{meta.blurb}</Text>
        </VStack>
        <Badge variant={statusBadgeVariant(state.status)}>{STATUS_LABEL[state.status]}</Badge>
      </HStack>

      {state.reference ? (
        <Text variant="caption" className="text-ink-soft mt-2" numberOfLines={1}>
          On file: {state.reference}
        </Text>
      ) : null}

      <Divider className="my-4" />

      {state.status === 'verified' ? (
        <HStack className="gap-2">
          <Button variant="outline" size="sm" onPress={() => setKycStatus(check, 'not_started')}>
            Re-verify
          </Button>
        </HStack>
      ) : (
        <VStack className="gap-3">
          {meta.takesReference ? (
            <VStack className="gap-1">
              <Text variant="label">Document link or reference</Text>
              <Input
                value={reference}
                onChangeText={setReference}
                placeholder={meta.placeholder}
                autoCapitalize="none"
              />
            </VStack>
          ) : null}
          <HStack className="gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onPress={submit}>
              {state.status === 'pending' ? 'Resubmit' : 'Submit for review'}
            </Button>
            {state.status === 'pending' ? (
              <Button variant="outline" size="sm" onPress={() => setKycStatus(check, 'verified')}>
                Mark verified
              </Button>
            ) : null}
          </HStack>
        </VStack>
      )}
    </Card>
  );
}
