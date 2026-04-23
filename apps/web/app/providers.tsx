'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSupabaseClient, setSupabaseClient } from '@bnb/api';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && url && anon) {
  setSupabaseClient(
    createSupabaseClient(url, anon, {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }),
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  }));
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
