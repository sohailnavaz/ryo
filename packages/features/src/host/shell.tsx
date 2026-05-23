import { ReactNode } from 'react';
import { useHostIsPreview } from '@bnb/api';
import { DashboardShell } from '../shared/dashboard-shell';

export const HOST_NAV = [
  { key: 'dashboard', label: 'Dashboard',  path: '/host' },
  { key: 'calendar',  label: 'Calendar',   path: '/host/calendar' },
  { key: 'bookings',  label: 'Bookings',   path: '/host/bookings' },
  { key: 'listings',  label: 'Listings',   path: '/host/listings' },
  { key: 'earnings',  label: 'Earnings',   path: '/host/earnings' },
  { key: 'inbox',     label: 'Inbox',      path: '/host/inbox' },
  { key: 'reviews',   label: 'Reviews',    path: '/host/reviews' },
  { key: 'insights',  label: 'Insights',   path: '/host/insights' },
  { key: 'settings',  label: 'Settings',   path: '/host/settings' },
] as const;

export function HostShell({
  title,
  subtitle,
  children,
  isPreview = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Override the auto-detected preview state. When omitted, the banner hides
   *  automatically once the signed-in host's real data loads. */
  isPreview?: boolean;
}) {
  // Detected from the shared dashboard query: false once real host data loads.
  const detected = useHostIsPreview();
  return (
    <DashboardShell
      kind="host"
      nav={HOST_NAV}
      eyebrow="Host dashboard"
      title={title}
      subtitle={subtitle}
      maxWidth={1280}
      isPreview={isPreview ?? detected}
    >
      {children}
    </DashboardShell>
  );
}
