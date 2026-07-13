'use client';

import { ReactNode, useState } from 'react';
import { useAdminOmnibox } from '@bnb/api';
import { CommandPalette } from '@bnb/ui/CommandPalette';
import { useRouter } from '@bnb/ui/nav';
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

/**
 * The admin chrome. Mounts ⌘K on every console page — the omnibox is the primary
 * navigation, so it must be reachable from wherever the operator happens to be
 * standing, not just from a search page they have to find first.
 * (docs/15-admin-console.md §3)
 */
export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const { data: hits, isFetching } = useAdminOmnibox(q);

  return (
    <DashboardShell
      kind="admin"
      nav={ADMIN_NAV}
      eyebrow="Maintenance · Operations"
      title={title}
      subtitle={subtitle}
      maxWidth={1320}
    >
      <CommandPalette
        query={q}
        onQueryChange={setQ}
        loading={isFetching && q.trim().length >= 2}
        items={(hits ?? []).map((h) => ({
          id: h.id,
          label: h.label,
          sublabel: h.sublabel,
          group: h.kind,
          href: h.href,
        }))}
        onSelect={(item) => {
          if (item.href) router.push(item.href);
        }}
      />
      {children}
    </DashboardShell>
  );
}
