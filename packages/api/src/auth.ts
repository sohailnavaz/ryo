import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';
import { signOutDemo, useDemoUser, type DemoUser } from './demo-auth';

/** Shape the demo user into the parts of `User` that downstream consumers read. */
function demoAsUser(d: DemoUser): User {
  return {
    id: d.id,
    email: d.email,
    user_metadata: {
      full_name: d.full_name,
      avatar_url: d.avatar_url ?? null,
    },
    app_metadata: { demo: true },
    aud: 'authenticated',
    created_at: new Date(0).toISOString(),
  } as unknown as User;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const demo = useDemoUser();

  useEffect(() => {
    const supabase = tryGetSupabase();
    if (!supabase) {
      // Supabase not configured (no env vars set in this environment).
      // Treat as "signed-out, finished loading" so the UI renders its
      // empty / preview state instead of crashing inside an effect.
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Real Supabase session always wins. Demo user only fills in when there
  // is no Supabase project wired (`tryGetSupabase()` returns null).
  const realUser = session?.user ?? null;
  const supabaseAvailable = tryGetSupabase() !== null;
  const effectiveUser = realUser ?? (!supabaseAvailable && demo ? demoAsUser(demo) : null);

  return { session, user: effectiveUser, loading };
}

export function useUser(): User | null {
  return useSession().user;
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Always clear the demo user too — it's a no-op if there isn't one.
      signOutDemo();
      const supabase = tryGetSupabase();
      if (!supabase) return; // demo-only sign out is fine when there's no real auth
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => qc.clear(),
  });
}

export function useSignInWithEmail() {
  return useMutation({
    mutationFn: async ({ email, redirectTo }: { email: string; redirectTo?: string }) => {
      const { error } = await getSupabase().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
    },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword(email: string, password: string, fullName?: string) {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}
