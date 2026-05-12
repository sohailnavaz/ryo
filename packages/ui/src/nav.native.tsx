import {
  Link as ExpoLink,
  router,
  useLocalSearchParams,
  usePathname as useExpoPathname,
} from 'expo-router';

export type Router = {
  push: (path: string) => void;
  replace: (path: string) => void;
  back: () => void;
};

export function useRouter(): Router {
  return {
    push: (path) => router.push(path as never),
    replace: (path) => router.replace(path as never),
    back: () => router.back(),
  };
}

export function useParams<T extends Record<string, string>>(): T {
  return useLocalSearchParams() as unknown as T;
}

export function usePathname(): string {
  return useExpoPathname() ?? '/';
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
    <ExpoLink href={href as never} className={className}>
      {children as never}
    </ExpoLink>
  );
}
