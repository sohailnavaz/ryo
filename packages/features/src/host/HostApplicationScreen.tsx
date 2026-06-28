import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  useMyHostApplication,
  useSubmitHostApplication,
  type HostApplicationInput,
  type HostApplicationStatus,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Input,
  Text,
  Toggle,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

const PROPERTY_TYPES = ['House', 'Apartment', 'Cabin', 'Villa', 'Treehouse', 'Cottage'];

type Step = 0 | 1 | 2 | 3 | 4;
const STEP_LABELS = ['Welcome', 'About you', 'Your place', 'Tax', 'Review'];

export function HostApplicationScreen() {
  const router = useRouter();
  const { application, status, isLoading } = useMyHostApplication();
  const submit = useSubmitHostApplication();

  // Already applied → show the status panel instead of the wizard, unless the
  // applicant has been asked for changes (then they may edit + resubmit).
  const canEdit = !application || status === 'changes_requested';
  if (!isLoading && application && !canEdit) {
    return <StatusPanel status={status!} note={application.review_note} onHome={() => router.push('/host')} />;
  }

  return (
    <WizardForm
      initial={application}
      banner={
        status === 'changes_requested' && application ? (
          <Card className="p-4 border border-brand-500/40 bg-brand-500/5">
            <Text className="font-semibold text-ink">A few changes were requested</Text>
            {application.review_note ? (
              <Text variant="small" className="text-ink-soft mt-1">
                “{application.review_note}”
              </Text>
            ) : null}
            <Text variant="small" className="text-ink-soft mt-1">
              Update your details below and resubmit.
            </Text>
          </Card>
        ) : null
      }
      onSubmit={(input) =>
        submit.mutate(input, {
          onSuccess: () => toast.success('Application submitted.', {
            description: 'Our team will review it shortly.',
          }),
          onError: (e: unknown) =>
            toast.error("Couldn't submit your application.", {
              description: e instanceof Error ? e.message : undefined,
            }),
        })
      }
      submitting={submit.isPending}
      submitted={submit.isSuccess}
    />
  );
}

// ---------------------------------------------------------------------------

function WizardForm({
  initial,
  banner,
  onSubmit,
  submitting,
  submitted,
}: {
  initial: ReturnType<typeof useMyHostApplication>['application'];
  banner: React.ReactNode;
  onSubmit: (input: HostApplicationInput) => void;
  submitting: boolean;
  submitted: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [propertyType, setPropertyType] = useState(initial?.property_type ?? 'Apartment');
  const [propertyCity, setPropertyCity] = useState(initial?.property_city ?? '');
  const [propertyCountry, setPropertyCountry] = useState(initial?.property_country ?? '');
  const [headline, setHeadline] = useState(initial?.headline ?? '');
  const [about, setAbout] = useState(initial?.about ?? '');
  const [taxId, setTaxId] = useState(initial?.tax_id ?? '');
  const [taxCountry, setTaxCountry] = useState(initial?.tax_country ?? '');
  const [agreed, setAgreed] = useState(initial?.agreed_terms ?? false);

  const identityValid = fullName.trim().length >= 2 && city.trim() && country.trim();
  const propertyValid = propertyCity.trim() && propertyCountry.trim() && headline.trim().length >= 6;

  if (submitted) {
    return <StatusPanel status="pending" note={null} onHome={() => router.push('/host')} />;
  }

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);

  const doSubmit = () => {
    if (!agreed) {
      toast.warning('Please agree to the host terms to continue.');
      return;
    }
    onSubmit({
      full_name: fullName.trim(),
      phone: phone.trim(),
      country: country.trim(),
      city: city.trim(),
      property_type: propertyType,
      property_city: propertyCity.trim(),
      property_country: propertyCountry.trim(),
      headline: headline.trim(),
      about: about.trim(),
      tax_id: taxId.trim(),
      tax_country: taxCountry.trim(),
      agreed_terms: agreed,
    });
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="md:mx-auto md:w-full md:max-w-[680px] px-4 pt-6 pb-24 md:px-10 md:pt-10 gap-6">
        <VStack className="gap-1">
          <Text variant="small" className="text-ink-soft uppercase tracking-wider">
            Become a host
          </Text>
          <Heading level={1}>Host with Ryo</Heading>
          <Text className="text-ink-soft">
            Tell us a little about you and your place. Every host is welcomed, not just
            approved — our team reviews each application personally.
          </Text>
        </VStack>

        <Stepper step={step} />
        {banner}

        {step === 0 ? (
          <Card className="p-5 gap-3">
            <Heading level={3}>What hosting on Ryo means</Heading>
            <Divider />
            <Bullet text="Vetted, supported hosting — with a 24/7 multilingual concierge behind you." />
            <Bullet text="Honest pricing and real guarantees, so guests arrive relaxed." />
            <Bullet text="You publish your first listing only after we welcome you aboard." />
            <Text variant="small" className="text-ink-soft mt-1">
              It takes about three minutes.
            </Text>
          </Card>
        ) : null}

        {step === 1 ? (
          <Card className="p-5 gap-4">
            <Heading level={3}>About you</Heading>
            <Divider />
            <Field label="Full name">
              <Input value={fullName} onChangeText={setFullName} placeholder="Aanya Rao" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChangeText={setPhone} placeholder="+1 555 0142" keyboardType="phone-pad" />
            </Field>
            <HStack className="gap-3">
              <Field label="City" className="flex-1">
                <Input value={city} onChangeText={setCity} placeholder="Lisbon" />
              </Field>
              <Field label="Country" className="flex-1">
                <Input value={country} onChangeText={setCountry} placeholder="Portugal" />
              </Field>
            </HStack>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card className="p-5 gap-4">
            <Heading level={3}>Your place</Heading>
            <Divider />
            <Field label="Property type">
              <Chips options={PROPERTY_TYPES} selected={propertyType} onPick={setPropertyType} />
            </Field>
            <HStack className="gap-3">
              <Field label="City" className="flex-1">
                <Input value={propertyCity} onChangeText={setPropertyCity} placeholder="Lisbon" />
              </Field>
              <Field label="Country" className="flex-1">
                <Input value={propertyCountry} onChangeText={setPropertyCountry} placeholder="Portugal" />
              </Field>
            </HStack>
            <Field label="Headline">
              <Input
                value={headline}
                onChangeText={setHeadline}
                placeholder="A calm, sunlit space minutes from the centre"
              />
            </Field>
            <Field label="About your hosting (optional)">
              <Input
                value={about}
                onChangeText={setAbout}
                placeholder="What makes staying with you special?"
                multiline
                numberOfLines={4}
              />
            </Field>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card className="p-5 gap-4">
            <Heading level={3}>Tax details</Heading>
            <Divider />
            <Text variant="small" className="text-ink-soft">
              We use this to pay you correctly. It’s optional now — you can complete it before
              your first payout.
            </Text>
            <Field label="Tax ID (optional)">
              <Input value={taxId} onChangeText={setTaxId} placeholder="—" autoCapitalize="characters" />
            </Field>
            <Field label="Tax country (optional)">
              <Input value={taxCountry} onChangeText={setTaxCountry} placeholder="Portugal" />
            </Field>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card className="p-5 gap-4">
            <Heading level={3}>Review & submit</Heading>
            <Divider />
            <SummaryRow label="Name" value={fullName} />
            <SummaryRow label="Phone" value={phone || '—'} />
            <SummaryRow label="Based in" value={[city, country].filter(Boolean).join(', ') || '—'} />
            <SummaryRow label="Property" value={`${propertyType} · ${[propertyCity, propertyCountry].filter(Boolean).join(', ') || '—'}`} />
            <SummaryRow label="Headline" value={headline || '—'} />
            <SummaryRow label="Tax" value={[taxId, taxCountry].filter((v) => v && v !== '—').join(' · ') || 'To complete later'} />
            <Divider />
            <HStack className="gap-3 items-start">
              <Toggle value={agreed} onChange={setAgreed} accessibilityLabel="Agree to host terms" />
              <Text variant="small" className="flex-1 text-ink-soft">
                I agree to Ryo’s host terms and confirm the details above are accurate.
              </Text>
            </HStack>
          </Card>
        ) : null}

        <HStack className="gap-2 justify-between">
          <Button
            title={step === 0 ? 'Cancel' : 'Back'}
            variant="ghost"
            onPress={step === 0 ? () => router.push('/host') : back}
          />
          {step < 4 ? (
            <Button
              title="Continue"
              onPress={next}
              disabled={(step === 1 && !identityValid) || (step === 2 && !propertyValid)}
            />
          ) : (
            <Button
              title={submitting ? 'Submitting…' : 'Submit application'}
              onPress={doSubmit}
              loading={submitting}
              disabled={!agreed}
            />
          )}
        </HStack>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function StatusPanel({
  status,
  note,
  onHome,
}: {
  status: HostApplicationStatus;
  note: string | null;
  onHome: () => void;
}) {
  const router = useRouter();
  const copy: Record<HostApplicationStatus, { badge: string; tone: 'brand' | 'dark'; title: string; body: string }> = {
    pending: {
      badge: 'In review',
      tone: 'brand',
      title: 'Your application is in review',
      body: 'Thank you for applying to host with Ryo. Our team reviews each application personally — we’ll be in touch soon.',
    },
    changes_requested: {
      badge: 'Changes requested',
      tone: 'brand',
      title: 'A few changes are needed',
      body: 'We’d love to welcome you — please update your details and resubmit.',
    },
    approved: {
      badge: 'Approved',
      tone: 'dark',
      title: 'Welcome aboard',
      body: 'You’re a Ryo host. You can now publish your first listing.',
    },
    rejected: {
      badge: 'Not approved',
      tone: 'dark',
      title: 'We couldn’t approve this application',
      body: 'Thank you for your interest. If you think this was a mistake, our team can take another look.',
    },
  };
  const c = copy[status] ?? copy.pending;
  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="md:mx-auto md:w-full md:max-w-[560px] px-4 pt-10 pb-24 md:px-10 gap-6">
        <VStack className="gap-2 items-start">
          <Badge variant={c.tone}>{c.badge}</Badge>
          <Heading level={1}>{c.title}</Heading>
          <Text className="text-ink-soft">{c.body}</Text>
        </VStack>
        {note ? (
          <Card className="p-4">
            <Text variant="small" className="text-ink-soft uppercase tracking-wider">
              Note from our team
            </Text>
            <Text className="mt-1">“{note}”</Text>
          </Card>
        ) : null}
        <HStack className="gap-2">
          {status === 'approved' ? (
            <Button title="Publish your first listing" onPress={() => router.push('/host/listings/new')} />
          ) : null}
          <Button title="Back to host home" variant="outline" onPress={onHome} />
        </HStack>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function Stepper({ step }: { step: Step }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {STEP_LABELS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <View
            key={label}
            className={`px-3 py-1.5 rounded-full ${
              active ? 'bg-ink' : done ? 'bg-brand-500/15' : 'bg-surface-alt'
            }`}
          >
            <Text
              variant="small"
              className={active ? 'text-surface font-semibold' : 'text-ink-soft'}
            >
              {i + 1}. {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <HStack className="gap-2 items-start">
      <Text className="text-brand-600">•</Text>
      <Text className="flex-1 text-ink-soft">{text}</Text>
    </HStack>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="gap-3 justify-between">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text variant="small" className="flex-1 text-right font-medium" numberOfLines={2}>
        {value}
      </Text>
    </HStack>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <VStack className={`gap-1.5 ${className ?? ''}`}>
      <Text variant="small" className="text-ink-soft font-semibold">
        {label}
      </Text>
      {children}
    </VStack>
  );
}

function Chips({
  options,
  selected,
  onPick,
}: {
  options: readonly string[];
  selected: string;
  onPick: (v: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o}
          title={o}
          variant={selected === o ? 'primary' : 'outline'}
          onPress={() => onPick(o)}
        />
      ))}
    </View>
  );
}
