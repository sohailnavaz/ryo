import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Heading, Pressable, Text, VStack } from '@bnb/ui';
import { useRouter, usePathname } from '@bnb/ui/nav';
import { PreviewBanner, type DashboardKind } from './dashboard-chrome';

export type NavItem = {
  key: string;
  label: string;
  path: string;
};

export type DashboardShellProps = {
  kind: DashboardKind;
  nav: readonly NavItem[];
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: number;
};

function isActive(pathname: string, item: NavItem): boolean {
  if (item.path === pathname) return true;
  // Highlight parents for nested routes (e.g. /host/bookings/123 → /host/bookings).
  // Avoid matching the bare root (`/host`, `/admin`) on every subpage.
  if (item.path.split('/').length <= 2) return false;
  return pathname.startsWith(item.path + '/');
}

export function DashboardShell({
  kind,
  nav,
  eyebrow,
  title,
  subtitle,
  children,
  maxWidth = 1280,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const railWidthClass = 'md:w-[224px]';

  return (
    <ScrollView className="flex-1 bg-surface">
      <View
        className="md:mx-auto md:w-full px-4 pt-4 pb-20 md:px-10 md:pt-8"
        style={{ maxWidth }}
      >
        <PreviewBanner kind={kind} />

        {/* Mobile horizontal tabs */}
        <View className="md:hidden mt-4 -mx-4 px-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            {nav.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Pressable
                  key={item.key}
                  onPress={() => router.push(item.path)}
                  className={`rounded-full px-4 py-2 border ${
                    active
                      ? 'bg-ink border-ink'
                      : 'bg-surface border-surface-border'
                  }`}
                >
                  <Text
                    variant="small"
                    className={active ? 'text-white font-semibold' : 'text-ink'}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="mt-6 md:mt-8 md:flex-row md:gap-10">
          {/* Desktop side rail */}
          <View className={`hidden md:flex ${railWidthClass} md:flex-shrink-0`}>
            <View className="md:sticky md:top-[88px]">
              <VStack className="gap-1">
                {nav.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => router.push(item.path)}
                      className={`rounded-xl px-3 py-2 ${
                        active ? 'bg-surface-alt' : ''
                      }`}
                    >
                      <Text
                        className={
                          active ? 'font-semibold text-ink' : 'text-ink-soft'
                        }
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </VStack>
            </View>
          </View>

          {/* Main column */}
          <View className="flex-1 min-w-0">
            <VStack className="gap-1">
              <Text
                variant="small"
                className="text-ink-soft uppercase tracking-wider"
              >
                {eyebrow}
              </Text>
              <Heading level={1}>{title}</Heading>
              {subtitle ? (
                <Text className="text-ink-soft">{subtitle}</Text>
              ) : null}
            </VStack>

            <View className="mt-2">{children}</View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
