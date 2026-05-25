import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@bnb/db';
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
    app_metadata: { demo: true, role: d.role },
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

  // Real Supabase session always wins. The demo identity fills in whenever
  // there's no real session — including when Supabase IS configured — so the
  // multi-role demo sign-in works on the live site. TEMPORARY testing bypass;
  // must be removed/gated before public launch (see demo-auth.ts).
  const realUser = session?.user ?? null;
  const effectiveUser = realUser ?? (demo ? demoAsUser(demo) : null);

  return { session, user: effectiveUser, loading };
}

export function useUser(): User | null {
  return useSession().user;
}

/** The current user's role. Demo users carry their role in `app_metadata.role`
 *  (multi-role demo sign-in). Real users are looked up from `profiles.role`.
 *  Returns `null` role when signed out. Gracefully degrades to `'guest'` if the
 *  role column isn't present yet (migration 0003 not applied). */
export function useRole(): { role: UserRole | null; loading: boolean } {
  const { user, loading: sessionLoading } = useSession();
  const supabase = tryGetSupabase();
  const meta = user?.app_metadata as { demo?: boolean; role?: UserRole } | undefined;
  const isDemo = meta?.demo === true;
  const realLookup = !!user && !!supabase && !isDemo;

  const { data, isLoading } = useQuery({
    queryKey: ['role', user?.id],
    enabled: realLookup,
    staleTime: 60_000,
    queryFn: async (): Promise<UserRole> => {
      const { data, error } = await getSupabase()
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single();
      if (error) return 'guest'; // column missing / row absent → safe default
      return ((data as { role?: UserRole } | null)?.role ?? 'guest') as UserRole;
    },
  });

  if (!user) return { role: null, loading: sessionLoading };
  if (isDemo) return { role: meta?.role ?? 'guest', loading: sessionLoading };
  if (!realLookup) return { role: 'guest', loading: sessionLoading };
  return { role: data ?? null, loading: sessionLoading || isLoading };
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

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async ({ redirectTo }: { redirectTo?: string } = {}) => {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
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

/** Send a password-reset email. The link returns to `redirectTo` (a page that
 *  sets the new password). Works for magic-link accounts too — it's how they
 *  set a password for the first time. */
export async function requestPasswordReset(email: string, redirectTo?: string) {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

/** Set a new password for the currently-authenticated (incl. recovery) session. */
export async function updatePassword(password: string) {
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) throw error;
}
