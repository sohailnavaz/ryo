'use client';
import { ErrorBoundary, ToastViewport, TopNav } from '@bnb/ui';
import { useRole, useSignOut, useInboxUnreadCount, useUser } from '@bnb/api';
import { useT, type MessageKey } from '@bnb/features';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { SiteFooter } from '../_components/SiteFooter';
import { Onboarding } from '../_components/Onboarding';
import { LanguageSwitcher } from '../_components/LanguageSwitcher';

const pathToKey = (p: string) => {
  if (p.startsWith('/stories')) return 'stories';
  if (p.startsWith('/discover')) return 'discover';
  if (p.startsWith('/trips')) return 'trips';
  if (p.startsWith('/wishlists')) return 'wishlists';
  if (p.startsWith('/profile')) return 'profile';
  return 'explore';
};

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = useInboxUnreadCount();
  // Host & admin are their own apps (they have their own sidebar shell). Don't
  // bleed the guest browse-nav into them — hide the Stays/Stories tabs + the
  // guest bottom tabs, and show a clear context label instead.
  const path = pathname ?? '/';
  const isDashboard = path.startsWith('/host') || path.startsWith('/admin');
  const context = path.startsWith('/admin') ? 'Operations' : 'Hosting';
  return (
    <div className="flex min-h-screen flex-col relative">
      <TopNav
        active={pathToKey(path)}
        onChange={(k) => router.push(k === 'explore' ? '/' : `/${k}`)}
        onOpenAccount={() => setMenuOpen((v) => !v)}
        onOpenNotifications={() => router.push('/notifications')}
        notificationCount={unread}
        showTabs={!isDashboard}
        context={isDashboard ? context : undefined}
        languageControl={<LanguageSwitcher variant="icon" direction="down" />}
      />
      <AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
      {!isDashboard ? <SiteFooter /> : null}
      {!isDashboard ? <MobileTabs /> : null}
      <ToastViewport />
      {!isDashboard ? <Onboarding /> : null}
    </div>
  );
}

function AccountMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const user = useUser();
  const { role } = useRole();
  const signOut = useSignOut();
  const unread = useInboxUnreadCount();
  const t = useT();
  if (!open) return null;

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const name = (user?.user_metadata as { full_name?: string } | undefined)?.full_name;
  const isHost = role === 'host' || role === 'admin' || role === 'staff';
  const isStaff = role === 'staff' || role === 'admin';

  const Item = ({ label, path, accent }: { label: string; path: string; accent?: boolean }) => (
    <button
      type="button"
      onClick={() => go(path)}
      className={`w-full px-4 py-2.5 text-left text-[14px] hover:bg-surface-alt ${
        accent ? 'font-semibold text-ink' : 'text-ink-soft'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* click-away backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="fixed inset-0 z-40 hidden md:block cursor-default"
      />
      <div className="pointer-events-none fixed inset-x-0 top-[64px] z-50 hidden md:flex md:justify-center">
        <div className="flex w-full max-w-[1600px] justify-end px-10">
          <div className="pointer-events-auto w-64 overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-card">
        {user ? (
          <div className="border-b border-surface-border px-4 py-3">
            <p className="text-[14px] font-semibold text-ink">{name ?? 'Signed in'}</p>
            <p className="text-[12px] capitalize text-ink-soft">{role ?? 'guest'} account</p>
          </div>
        ) : null}

        <div className="py-1">
          {user ? (
            <>
              <Item label={t('nav.account')} path="/account" accent />
              <Item label={t('nav.trips')} path="/trips" />
              <Item label={t('nav.wishlists')} path="/wishlists" />
              <Item label={unread > 0 ? `${t('nav.notifications')} (${unread})` : t('nav.notifications')} path="/notifications" />
              <Item label={t('nav.profile')} path="/profile" />
            </>
          ) : null}

          <div className="my-1 h-px bg-surface-border" />
          <Item label={`🛎️ ${t('nav.concierge')}`} path="/concierge" accent />
          <Item label={t('nav.helpCenter')} path="/faq" />
          <Item label={t('nav.help')} path="/help" />
          <Item label={t('nav.offlinePack')} path="/offline" />
          <Item label={t('nav.phrasebook')} path="/phrasebook" />

          {isHost ? (
            <>
              <div className="my-1 h-px bg-surface-border" />
              <Item label={t('nav.hostDashboard')} path="/host" accent />
            </>
          ) : null}

          {isStaff ? <Item label={t('nav.adminConsole')} path="/admin" accent /> : null}

          <div className="my-1 h-px bg-surface-border" />
          {user ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                signOut.mutate(undefined, { onSuccess: () => router.push('/') });
              }}
              className="w-full px-4 py-2.5 text-left text-[14px] text-ink-soft hover:bg-surface-alt"
            >
              Sign out
            </button>
          ) : (
            <Item label="Sign in" path="/sign-in" accent />
          )}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const key = pathToKey(pathname ?? '/');
  const tabs: Array<{ key: string; label: MessageKey; path: string }> = [
    { key: 'explore', label: 'nav.explore', path: '/' },
    { key: 'wishlists', label: 'nav.wishlists', path: '/wishlists' },
    { key: 'trips', label: 'nav.trips', path: '/trips' },
    { key: 'concierge', label: 'nav.concierge', path: '/concierge' },
    { key: 'profile', label: 'nav.profile', path: '/profile' },
  ];
  return (
    <nav className="md:hidden sticky bottom-0 left-0 right-0 border-t border-surface-border bg-surface flex">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => router.push(tab.path)}
          className={`flex-1 py-2.5 text-[11px] font-semibold ${
            key === tab.key ? 'text-brand-500' : 'text-ink-soft'
          }`}
        >
          {t(tab.label)}
        </button>
      ))}
    </nav>
  );
}
