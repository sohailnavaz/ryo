'use client';
import NextLink from 'next/link';
import {
  useRouter as useNextRouter,
  useSearchParams,
  usePathname as useNextPathname,
} from 'next/navigation';

export type Router = {
  push: (path: string) => void;
  replace: (path: string) => void;
  back: () => void;
};

export function useRouter(): Router {
  const r = useNextRouter();
  return {
    push: (path) => r.push(path),
    replace: (path) => r.replace(path),
    back: () => r.back(),
  };
}

export function useParams<T extends Record<string, string>>(): T {
  const sp = useSearchParams();
  const pathname = useNextPathname();
  const out: Record<string, string> = {};
  sp?.forEach((v, k) => {
    out[k] = v;
  });
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  const last = segments[segments.length - 1];
  if (last) out.id = last;
  return out as T;
}

export function usePathname(): string {
  return useNextPathname() ?? '/';
}

export function Link({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <NextLink href={href} className={className}>
      {children}
    </NextLink>
  );
}
