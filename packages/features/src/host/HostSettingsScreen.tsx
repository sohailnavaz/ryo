import { View } from 'react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Input,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { HostShell } from './shell';

export function HostSettingsScreen() {
  const stub = () => toast.info('Preview only — settings would persist to your account.');

  return (
    <HostShell
      title="Settings"
      subtitle="Profile, payout, tax, co-host team. Read-only in v2 preview."
    >
      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1 gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Profile</Text>
            <HStack className="mt-3 gap-3 items-center">
              <Avatar name="Mira Host" size={64} />
              <VStack className="flex-1 gap-0.5">
                <Text className="font-semibold">Mira Host</Text>
                <Text variant="small" className="text-ink-soft">host@ryostays.com</Text>
              </VStack>
              <Button variant="outline" size="sm" onPress={stub}>Edit</Button>
            </HStack>
            <Divider className="my-4" />
            <VStack className="gap-3">
              <Input label="Display name" value="Mira Host" editable={false} />
              <Input label="Public bio"   value="Boutique host in Lisbon and Tokyo. Tea on arrival, slow Sundays." editable={false} multiline />
              <Input label="Languages"    value="English · Português · 日本語" editable={false} />
            </VStack>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Payout method</Text>
            <View className="mt-3">
              <Row label="Bank"        value="Wise · USD · ••••4291" />
              <Row label="Currency"    value="USD" />
              <Row label="Threshold"   value="$0 — pay on every booking" />
            </View>
            <Button variant="outline" className="mt-4" onPress={stub}>
              Change payout method
            </Button>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Tax</Text>
            <View className="mt-3">
              <Row label="Tax form"        value="W-9 on file" />
              <Row label="Jurisdiction"    value="United States" />
              <Row label="Reporting year"  value="2026" />
            </View>
            <Button variant="outline" className="mt-4" onPress={stub}>
              Update tax info
            </Button>
          </Card>
        </View>

        <View className="md:w-[360px] gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Co-host team</Text>
            <Text variant="small" className="mt-1 text-ink-soft">
              Invite trusted helpers with scoped permissions.
            </Text>
            <VStack className="mt-4 gap-3">
              <TeamRow name="Naomi Tanaka" scope="messages-only" />
              <TeamRow name="Diego Cruz"   scope="calendar-only" />
            </VStack>
            <Button variant="outline" className="mt-4" onPress={stub}>
              Invite co-host
            </Button>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Notifications</Text>
            <VStack className="mt-3 gap-2">
              <NotifRow label="New booking"        on />
              <NotifRow label="New message"        on />
              <NotifRow label="Payout sent"        on />
              <NotifRow label="Review received"    on />
              <NotifRow label="Calendar conflicts" on />
              <NotifRow label="Marketing"          on={false} />
            </VStack>
          </Card>

          <Card className="p-5">
            <Heading level={3}>Danger zone</Heading>
            <Text variant="small" className="mt-1 text-ink-soft">
              Pausing pauses all listings. Cancelling future bookings counts against your acceptance rate.
            </Text>
            <Button variant="outline" className="mt-4" onPress={stub}>
              Pause all listings
            </Button>
          </Card>
        </View>
      </View>
    </HostShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between py-1">
      <Text variant="small" className="text-ink-soft">{label}</Text>
      <Text>{value}</Text>
    </HStack>
  );
}

function TeamRow({ name, scope }: { name: string; scope: string }) {
  return (
    <HStack className="gap-3 items-center">
      <Avatar name={name} size={32} />
      <VStack className="flex-1 gap-0.5">
        <Text className="font-semibold">{name}</Text>
        <Text variant="caption" className="text-ink-soft">{scope}</Text>
      </VStack>
      <Badge variant="neutral">active</Badge>
    </HStack>
  );
}

function NotifRow({ label, on }: { label: string; on: boolean }) {
  return (
    <HStack className="justify-between">
      <Text variant="small">{label}</Text>
      <Badge variant={on ? 'dark' : 'neutral'}>{on ? 'on' : 'off'}</Badge>
    </HStack>
  );
}
