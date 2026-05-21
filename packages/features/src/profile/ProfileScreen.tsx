import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  tryGetSupabase,
  useMyProfile,
  useSignOut,
  useUpdateProfile,
  type ProfilePatch,
  type RyoProfile,
} from '@bnb/api';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Input,
  LogOut,
  Text,
  toast,
  Toggle,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

const LOCALES = ['en-IN', 'en-US', 'hi-IN', 'es-ES', 'fr-FR', 'ja-JP', 'ar-AE'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Arabic', 'Japanese', 'German', 'Portuguese'];

export function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useMyProfile();
  const signOut = useSignOut();

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-surface p-6 gap-4 md:mx-auto md:max-w-md md:pt-10">
        <Heading level={2}>Log in or sign up</Heading>
        <Text className="text-ink-soft">
          Create an account or sign in to manage your profile, trips, wishlists, and more.
        </Text>
        <Button title="Continue with email" onPress={() => router.push('/sign-in')} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="md:mx-auto md:w-full md:max-w-[820px] px-4 pt-6 pb-24 md:px-10 md:pt-8 gap-6">
        <Header profile={profile} />

        {profile.is_demo ? (
          <Card className="p-4 bg-surface-alt border-0">
            <Text variant="small" className="text-ink-soft">
              Demo account — changes save to this browser only. Sign in with a real account to
              persist your profile.
            </Text>
          </Card>
        ) : null}

        <AboutSection profile={profile} />
        <PersonalInfoSection profile={profile} />
        <PreferencesSection profile={profile} />
        <NotificationsSection profile={profile} />
        <SecuritySection email={profile.email} isDemo={profile.is_demo} />

        <Button
          title={signOut.isPending ? 'Signing out…' : 'Sign out'}
          variant="outline"
          loading={signOut.isPending}
          leftIcon={<LogOut size={16} color="#222" />}
          onPress={() => signOut.mutate(undefined, { onSuccess: () => router.replace('/') })}
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function Header({ profile }: { profile: RyoProfile }) {
  const name = profile.preferred_name || profile.full_name || profile.email || 'Guest';
  const sub = [profile.city, profile.country].filter(Boolean).join(', ');
  return (
    <Card className="p-5">
      <HStack className="gap-4 items-center">
        <Avatar src={profile.avatar_url} name={name} size={72} />
        <VStack className="flex-1">
          <Heading level={2}>{name}</Heading>
          {sub ? <Text className="text-ink-soft">{sub}</Text> : null}
          {profile.email ? (
            <Text variant="small" className="text-ink-soft">
              {profile.email}
            </Text>
          ) : null}
        </VStack>
      </HStack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Each section is an independently-editable card.
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  subtitle,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  children,
  canEdit = true,
}: {
  title: string;
  subtitle?: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
  canEdit?: boolean;
}) {
  return (
    <Card className="p-5 gap-3">
      <HStack className="justify-between items-start gap-3">
        <VStack className="flex-1">
          <Heading level={3}>{title}</Heading>
          {subtitle ? (
            <Text variant="small" className="text-ink-soft">
              {subtitle}
            </Text>
          ) : null}
        </VStack>
        {canEdit && !editing ? (
          <Button title="Edit" variant="ghost" onPress={onEdit} />
        ) : null}
      </HStack>
      <Divider />
      {children}
      {editing ? (
        <HStack className="gap-2 mt-1">
          <Button title="Cancel" variant="ghost" onPress={onCancel} />
          <Button title={saving ? 'Saving…' : 'Save'} onPress={onSave} loading={saving} />
        </HStack>
      ) : null}
    </Card>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between items-start gap-4 py-1">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text className="font-semibold text-right flex-1" numberOfLines={2}>
        {value || '—'}
      </Text>
    </HStack>
  );
}

function ChipPicker({
  options,
  selected,
  onToggle,
  multi = false,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <Button
            key={o}
            title={o}
            variant={on ? 'primary' : 'outline'}
            onPress={() => onToggle(o)}
          />
        );
      })}
    </View>
  );
}

// ---- About ----------------------------------------------------------------

function AboutSection({ profile }: { profile: RyoProfile }) {
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio);
  const [work, setWork] = useState(profile.work);
  const [languages, setLanguages] = useState<string[]>(profile.languages);

  useEffect(() => {
    setBio(profile.bio);
    setWork(profile.work);
    setLanguages(profile.languages);
  }, [profile.bio, profile.work, profile.languages]);

  const save = () => doSave(update, { bio, work, languages }, () => setEditing(false));

  return (
    <SectionCard
      title="About you"
      subtitle="Shared on your public profile"
      editing={editing}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={update.isPending}
    >
      {editing ? (
        <VStack className="gap-3">
          <LabeledInput label="Bio" value={bio} onChangeText={setBio} placeholder="Tell guests a little about yourself" multiline />
          <LabeledInput label="Work" value={work} onChangeText={setWork} placeholder="What you do" />
          <VStack className="gap-2">
            <Text variant="small" className="text-ink-soft font-semibold">Languages you speak</Text>
            <ChipPicker
              options={LANGUAGES}
              selected={languages}
              multi
              onToggle={(v) =>
                setLanguages((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))
              }
            />
          </VStack>
        </VStack>
      ) : (
        <VStack className="gap-1">
          <FieldRow label="Bio" value={profile.bio} />
          <FieldRow label="Work" value={profile.work} />
          <FieldRow label="Languages" value={profile.languages.join(', ')} />
        </VStack>
      )}
    </SectionCard>
  );
}

// ---- Personal info --------------------------------------------------------

function PersonalInfoSection({ profile }: { profile: RyoProfile }) {
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [preferredName, setPreferredName] = useState(profile.preferred_name);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);
  const [country, setCountry] = useState(profile.country);

  useEffect(() => {
    setFullName(profile.full_name);
    setPreferredName(profile.preferred_name);
    setPhone(profile.phone);
    setCity(profile.city);
    setCountry(profile.country);
  }, [profile.full_name, profile.preferred_name, profile.phone, profile.city, profile.country]);

  const save = () =>
    doSave(update, { full_name: fullName, preferred_name: preferredName, phone, city, country }, () =>
      setEditing(false),
    );

  return (
    <SectionCard
      title="Personal info"
      editing={editing}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={update.isPending}
    >
      {editing ? (
        <VStack className="gap-3">
          <LabeledInput label="Legal name" value={fullName} onChangeText={setFullName} />
          <LabeledInput label="Preferred name" value={preferredName} onChangeText={setPreferredName} placeholder="What we call you" />
          <LabeledInput label="Phone" value={phone} onChangeText={setPhone} placeholder="+91 …" keyboardType="phone-pad" />
          <HStack className="gap-3">
            <View className="flex-1">
              <LabeledInput label="City" value={city} onChangeText={setCity} />
            </View>
            <View className="flex-1">
              <LabeledInput label="Country" value={country} onChangeText={setCountry} />
            </View>
          </HStack>
        </VStack>
      ) : (
        <VStack className="gap-1">
          <FieldRow label="Legal name" value={profile.full_name} />
          <FieldRow label="Preferred name" value={profile.preferred_name} />
          <FieldRow label="Email" value={profile.email ?? ''} />
          <FieldRow label="Phone" value={profile.phone} />
          <FieldRow label="Location" value={[profile.city, profile.country].filter(Boolean).join(', ')} />
        </VStack>
      )}
    </SectionCard>
  );
}

// ---- Preferences ----------------------------------------------------------

function PreferencesSection({ profile }: { profile: RyoProfile }) {
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [locale, setLocale] = useState(profile.preferred_locale);
  const [currency, setCurrency] = useState(profile.preferred_currency);

  useEffect(() => {
    setLocale(profile.preferred_locale);
    setCurrency(profile.preferred_currency);
  }, [profile.preferred_locale, profile.preferred_currency]);

  const save = () =>
    doSave(update, { preferred_locale: locale, preferred_currency: currency }, () =>
      setEditing(false),
    );

  return (
    <SectionCard
      title="Preferences"
      editing={editing}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={update.isPending}
    >
      {editing ? (
        <VStack className="gap-4">
          <VStack className="gap-2">
            <Text variant="small" className="text-ink-soft font-semibold">Language</Text>
            <ChipPicker options={LOCALES} selected={[locale]} onToggle={setLocale} />
          </VStack>
          <VStack className="gap-2">
            <Text variant="small" className="text-ink-soft font-semibold">Currency</Text>
            <ChipPicker options={CURRENCIES} selected={[currency]} onToggle={setCurrency} />
          </VStack>
        </VStack>
      ) : (
        <VStack className="gap-1">
          <FieldRow label="Language" value={profile.preferred_locale} />
          <FieldRow label="Currency" value={profile.preferred_currency} />
        </VStack>
      )}
    </SectionCard>
  );
}

// ---- Notifications --------------------------------------------------------

function NotificationsSection({ profile }: { profile: RyoProfile }) {
  const update = useUpdateProfile();
  const set = (patch: ProfilePatch) =>
    update.mutate(patch, {
      onError: (e) =>
        toast.error("Couldn't update notifications.", {
          description: e instanceof Error ? e.message : undefined,
        }),
    });

  const Row = ({ label, hint, k }: { label: string; hint: string; k: keyof RyoProfile }) => (
    <HStack className="justify-between items-center py-1">
      <VStack className="flex-1 pr-3">
        <Text className="font-semibold">{label}</Text>
        <Text variant="small" className="text-ink-soft">{hint}</Text>
      </VStack>
      <Toggle
        value={profile[k] as boolean}
        onChange={(next) => set({ [k]: next } as ProfilePatch)}
        accessibilityLabel={label}
      />
    </HStack>
  );

  return (
    <Card className="p-5 gap-3">
      <Heading level={3}>Notifications</Heading>
      <Divider />
      <Row label="Email" hint="Booking confirmations, receipts, trip updates" k="notif_email" />
      <Row label="Push" hint="Real-time alerts in the app" k="notif_push" />
      <Row label="SMS" hint="Arrival-day reminders only" k="notif_sms" />
    </Card>
  );
}

// ---- Login & security -----------------------------------------------------

function SecuritySection({ email, isDemo }: { email: string | null; isDemo: boolean }) {
  const [sentReset, setSentReset] = useState(false);

  const sendPasswordReset = async () => {
    const supabase = tryGetSupabase();
    if (!supabase || !email) {
      toast.info('Password reset needs a signed-in real account.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSentReset(true);
      toast.success('Password reset email sent.', { description: `Check ${email}.` });
    } catch (e) {
      toast.error("Couldn't send reset email.", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <Card className="p-5 gap-3">
      <Heading level={3}>Login & security</Heading>
      <Divider />
      <HStack className="justify-between items-center py-1">
        <VStack className="flex-1 pr-3">
          <Text className="font-semibold">Password</Text>
          <Text variant="small" className="text-ink-soft">
            {sentReset ? 'Reset email sent.' : 'Send yourself a reset link.'}
          </Text>
        </VStack>
        <Button title="Reset" variant="outline" onPress={sendPasswordReset} disabled={isDemo} />
      </HStack>
      <HStack className="justify-between items-center py-1">
        <VStack className="flex-1 pr-3">
          <Text className="font-semibold">Two-factor authentication</Text>
          <Text variant="small" className="text-ink-soft">Adds a code on sign-in. Coming soon.</Text>
        </VStack>
        <Button title="Set up" variant="outline" disabled />
      </HStack>
      <HStack className="justify-between items-center py-1">
        <VStack className="flex-1 pr-3">
          <Text className="font-semibold">Delete account</Text>
          <Text variant="small" className="text-ink-soft">Permanently remove your data.</Text>
        </VStack>
        <Button
          title="Delete"
          variant="outline"
          onPress={() =>
            toast.info('Account deletion', {
              description: 'Hooked up with the trust & safety flow in v2 (soft-delete + 30-day grace).',
            })
          }
        />
      </HStack>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function LabeledInput({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <VStack className="gap-1.5">
      <Text variant="small" className="text-ink-soft font-semibold">
        {label}
      </Text>
      <Input {...props} />
    </VStack>
  );
}

function doSave(
  update: ReturnType<typeof useUpdateProfile>,
  patch: ProfilePatch,
  onDone: () => void,
) {
  update.mutate(patch, {
    onSuccess: () => {
      toast.success('Profile updated.');
      onDone();
    },
    onError: (e) =>
      toast.error("Couldn't save your profile.", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });
}
