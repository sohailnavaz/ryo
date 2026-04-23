'use client';
import { TopNav } from '@bnb/ui';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';

const pathToKey = (p: string) => {
  if (p.startsWith('/trips')) return 'trips';
  if (p.startsWith('/wishlists')) return 'wishlists';
  if (p.startsWith('/profile')) return 'profile';
  return 'explore';
};

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav
        active={pathToKey(pathname ?? '/')}
        onChange={(k) => router.push(k === 'explore' ? '/' : `/${k}`)}
        onOpenAccount={() => router.push('/profile')}
      />
      <div className="flex-1 flex flex-col">{children}</div>
      <MobileTabs />
    </div>
  );
}

function MobileTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const key = pathToKey(pathname ?? '/');
  const tabs: Array<{ key: string; label: string; path: string; icon: string }> = [
    { key: 'explore', label: 'Explore', path: '/', icon: 'compass' },
    { key: 'wishlists', label: 'Wishlists', path: '/wishlists', icon: 'heart' },
    { key: 'trips', label: 'Trips', path: '/trips', icon: 'home' },
    { key: 'profile', label: 'Profile', path: '/profile', icon: 'user' },
  ];
  return (
    <nav className="md:hidden sticky bottom-0 left-0 right-0 border-t border-surface-border bg-surface flex">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => router.push(t.path)}
          className={`flex-1 py-2.5 text-[11px] font-semibold ${
            key === t.key ? 'text-brand-500' : 'text-ink-soft'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
