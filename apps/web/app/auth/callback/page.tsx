'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Callback() {
  const router = useRouter();
  useEffect(() => {
    // Supabase auth client (configured with detectSessionInUrl) will exchange the
    // token automatically on load. Redirect once the URL has been handled.
    const t = setTimeout(() => router.replace('/'), 600);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center text-ink-soft">
      Signing you in…
    </div>
  );
}
