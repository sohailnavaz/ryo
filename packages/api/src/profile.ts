// Guest profile — read + write.
//
// Profile fields live in the authenticated user's `user_metadata` (written via
// supabase.auth.updateUser). This needs no schema migration and persists to the
// real auth.users row. The `handle_new_user` trigger already mirrors full_name +
// avatar_url into public.profiles on signup; a future migration can sync the rest
// for public-profile / "reviews about me" use cases.
//
// When Supabase isn't configured (preview / demo), reads + writes fall back to
// the demo-auth store so the screen still works.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDemoUser, setDemoUser } from './demo-auth';
import { tryGetSupabase } from './client';

export type RyoProfile = {
  id: string | null;
  full_name: string;
  preferred_name: string;
  email: string | null;
  avatar_url: string | null;
  phone: string;
  bio: string;
  city: string;
  country: string;
  languages: string[];
  work: string;
  preferred_locale: string;
  preferred_currency: string;
  notif_email: boolean;
  notif_push: boolean;
  notif_sms: boolean;
  is_demo: boolean;
};

export type ProfilePatch = Partial<Omit<RyoProfile, 'id' | 'email' | 'is_demo'>>;

const EMPTY: Omit<RyoProfile, 'id' | 'email' | 'is_demo'> = {
  full_name: '',
  preferred_name: '',
  avatar_url: null,
  phone: '',
  bio: '',
  city: '',
  country: '',
  languages: [],
  work: '',
  preferred_locale: 'en-US',
  preferred_currency: 'USD',
  notif_email: true,
  notif_push: true,
  notif_sms: false,
};

type Meta = Record<string, unknown>;

function fromMeta(meta: Meta): Omit<RyoProfile, 'id' | 'email' | 'is_demo'> {
  const str = (k: string, d = '') => (typeof meta[k] === 'string' ? (meta[k] as string) : d);
  const bool = (k: string, d: boolean) => (typeof meta[k] === 'boolean' ? (meta[k] as boolean) : d);
  return {
    full_name: str('full_name'),
    preferred_name: str('preferred_name'),
    avatar_url: (meta['avatar_url'] as string | undefined) ?? null,
    phone: str('phone'),
    bio: str('bio'),
    city: str('city'),
    country: str('country'),
    languages: Array.isArray(meta['languages']) ? (meta['languages'] as string[]) : [],
    work: str('work'),
    preferred_locale: str('preferred_locale', 'en-US'),
    preferred_currency: str('preferred_currency', 'USD'),
    notif_email: bool('notif_email', true),
    notif_push: bool('notif_push', true),
    notif_sms: bool('notif_sms', false),
  };
}

export async function fetchMyProfile(): Promise<RyoProfile | null> {
  const supabase = tryGetSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const meta = (user.user_metadata ?? {}) as Meta;
      return {
        id: user.id,
        email: user.email ?? null,
        is_demo: false,
        ...EMPTY,
        ...fromMeta(meta),
        // full_name falls back to the email local-part if never set
        full_name: fromMeta(meta).full_name || (user.email?.split('@')[0] ?? ''),
      };
    }
  }
  // Demo fallback
  const demo = getDemoUser();
  if (demo) {
    return {
      id: demo.id,
      email: demo.email,
      is_demo: true,
      ...EMPTY,
      full_name: demo.full_name,
      avatar_url: demo.avatar_url ?? null,
    };
  }
  return null;
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: fetchMyProfile,
    staleTime: 30_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ProfilePatch) => {
      const supabase = tryGetSupabase();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const merged = { ...(user.user_metadata ?? {}), ...patch };
          const { error } = await supabase.auth.updateUser({ data: merged });
          if (error) throw error;
          return;
        }
      }
      // Demo fallback — persist what the demo store can hold.
      const demo = getDemoUser();
      if (demo) {
        setDemoUser({
          ...demo,
          full_name: patch.full_name ?? demo.full_name,
          avatar_url: patch.avatar_url ?? demo.avatar_url,
        });
        return;
      }
      throw new Error('Not signed in');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['guest-dashboard'] });
    },
  });
}
