'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSupabaseClient, setSupabaseClient } from '@bnb/api';

// NEXT_PUBLIC_* are inlined at build time. Vercel dashboard env vars take
// precedence when set; we fall back to the live project's PUBLIC values so the
// production build always connects to real Supabase regardless of env-var
// wiring. The anon key is public by design (it ships in every client bundle and
// is protected by RLS) — safe to embed.
const FALLBACK_SUPABASE_URL = 'https://mtldmawenkdebtchnocs.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bGRtYXdlbmtkZWJ0Y2hub2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTM4ODgsImV4cCI6MjA5NDkyOTg4OH0.OOON0HTmVyfQ08Ery4HtlDXMn33YAsgbIm_C1jvnVAc';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

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
