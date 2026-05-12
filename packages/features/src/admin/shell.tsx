import { ReactNode } from 'react';
import { DashboardShell } from '../shared/dashboard-shell';

export const ADMIN_NAV = [
  { key: 'overview',   label: 'Overview',    path: '/admin' },
  { key: 'search',     label: 'Search',      path: '/admin/search' },
  { key: 'users',      label: 'Users',       path: '/admin/users' },
  { key: 'bookings',   label: 'Bookings',    path: '/admin/bookings' },
  { key: 'moderation', label: 'Moderation',  path: '/admin/moderation' },
  { key: 'incidents',  label: 'Incidents',   path: '/admin/incidents' },
  { key: 'finance',    label: 'Finance',     path: '/admin/finance' },
  { key: 'flags',      label: 'Flags',       path: '/admin/flags' },
  { key: 'audit',      label: 'Audit log',   path: '/admin/audit' },
  { key: 'health',     label: 'System',      path: '/admin/health' },
] as const;

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <DashboardShell
      kind="admin"
      nav={ADMIN_NAV}
      eyebrow="Maintenance · Operations"
      title={title}
      subtitle={subtitle}
      maxWidth={1320}
    >
      {children}
    </DashboardShell>
  );
}
