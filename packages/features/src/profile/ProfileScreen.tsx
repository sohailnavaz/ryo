import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  setDemoUser,
  tryGetSupabase,
  useDemoUser,
  useSession,
  useSignOut,
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
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

type EditForm = {
  full_name: string;
  preferred_locale: string;
  preferred_currency: string;
};

const LOCALES = ['en-IN', 'en-US', 'hi-IN', 'es-ES', 'fr-FR', 'ja-JP'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD'];

export function ProfileScreen() {
  const { user, loading } = useSession();
  const signOut = useSignOut();
  const router = useRouter();
  const demo = useDemoUser();
  const supabaseConfigured = tryGetSupabase() !== null;

  // Seed the edit form from the current user (demo or real).
  const initialName = (user?.user_metadata?.['full_name'] as string | undefined) ?? '';
  const initialLocale =
    (user?.user_metadata?.['preferred_locale'] as string | undefined) ?? 'en-US';
  const initialCurrency =
    (user?.user_metadata?.['preferred_currency'] as string | undefined) ?? 'USD';

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    full_name: initialName,
    preferred_locale: initialLocale,
    preferred_currency: initialCurrency,
  });
  const [saving, setSaving] = useState(false);

  // Keep the form in sync when the user object updates.
  useEffect(() => {
    setForm({
      full_name: initialName,
      preferred_locale: initialLocale,
      preferred_currency: initialCurrency,
    });
  }, [initialName, initialLocale, initialCurrency]);

  if (loading) {
    return (
      <View className="flex-1 bg-surface p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-surface p-6 gap-4 md:mx-auto md:max-w-md">
        <Heading level={2}>Log in or sign up</Heading>
        <Text className="text-ink-soft">
          Create an account or sign in to see your trips, wishlists, and more.
        </Text>
        <Button title="Continue with email" onPress={() => router.push('/sign-in')} />
      </View>
    );
  }

  const isDemo = !!demo && !supabaseConfigured;
  const name = form.full_name || user.email || 'Guest';

  const save = async () => {
    setSaving(true);
    try {
      if (isDemo && demo) {
        // Demo mode: write through to the demo-auth store + localStorage.
        setDemoUser({
          ...demo,
          full_name: form.full_name || demo.full_name,
        });
        toast.success('Profile updated.');
        setEditing(false);
        return;
      }

      // Real Supabase path: update auth user metadata.
      const supabase = tryGetSupabase();
      if (!supabase) {
        toast.error("Couldn't save — auth backend isn't configured here.");
        return;
      }
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: form.full_name,
          preferred_locale: form.preferred_locale,
          preferred_currency: form.preferred_currency,
        },
      });
      if (error) throw error;
      toast.success('Profile updated.');
      setEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save your profile.';
      toast.error("Couldn't save your profile.", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      full_name: initialName,
      preferred_locale: initialLocale,
      preferred_currency: initialCurrency,
    });
    setEditing(false);
  };

  return (
    <View className="flex-1 bg-surface p-4 md:mx-auto md:max-w-[720px] md:w-full md:px-10 md:pt-8">
      <Heading level={1}>Profile</Heading>

      {/* Profile card */}
      <Card className="mt-4 p-5">
        <HStack className="gap-4 items-center">
          <Avatar src={demo?.avatar_url ?? null} name={name} size={64} />
          <VStack className="flex-1">
            <Text className="text-[18px] font-semibold">{name}</Text>
            <Text className="text-ink-soft">{user.email}</Text>
            {isDemo ? (
              <Text variant="caption" className="mt-1">
                Demo account · changes save to this browser only
              </Text>
            ) : null}
          </VStack>
          {!editing ? (
            <Button title="Edit" variant="outline" onPress={() => setEditing(true)} />
          ) : null}
        </HStack>
      </Card>

      {/* Edit form */}
      {editing ? (
        <Card className="mt-4 p-5">
          <VStack className="gap-3">
            <Heading level={3}>Edit profile</Heading>
            <Input
              label="Full name"
              value={form.full_name}
              onChangeText={(v) => setForm({ ...form, full_name: v })}
              placeholder="Mira Host"
            />
            <SelectField
              label="Language"
              value={form.preferred_locale}
              options={LOCALES}
              onChange={(v) => setForm({ ...form, preferred_locale: v })}
            />
            <SelectField
              label="Currency"
              value={form.preferred_currency}
              options={CURRENCIES}
              onChange={(v) => setForm({ ...form, preferred_currency: v })}
            />
            <HStack className="gap-2 mt-2">
              <Button title="Cancel" variant="ghost" onPress={cancelEdit} />
              <Button
                title={saving ? 'Saving…' : 'Save changes'}
                onPress={save}
                loading={saving}
              />
            </HStack>
          </VStack>
        </Card>
      ) : (
        <Card className="mt-4 p-5">
          <VStack className="gap-3">
            <FieldRow label="Language" value={form.preferred_locale} />
            <Divider />
            <FieldRow label="Currency" value={form.preferred_currency} />
          </VStack>
        </Card>
      )}

      <Divider />

      <VStack className="gap-3">
        <Heading level={3}>Account</Heading>
        <Button
          title="Sign out"
          variant="outline"
          leftIcon={<LogOut size={16} color="#222" />}
          onPress={() => signOut.mutate()}
        />
      </VStack>
    </View>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between items-center">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text className="font-semibold">{value}</Text>
    </HStack>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <VStack className="gap-2">
      <Text variant="small" className="text-ink-soft font-semibold">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const selected = o === value;
          return (
            <Button
              key={o}
              title={o}
              variant={selected ? 'primary' : 'outline'}
              onPress={() => onChange(o)}
            />
          );
        })}
      </View>
    </VStack>
  );
}
