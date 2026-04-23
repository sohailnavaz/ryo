import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

export function createSupabaseClient(url: string, anonKey: string, options?: {
  storage?: unknown;
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean;
}): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      storage: options?.storage as never,
      autoRefreshToken: options?.autoRefreshToken ?? true,
      persistSession: options?.persistSession ?? true,
      detectSessionInUrl: options?.detectSessionInUrl ?? true,
    },
  });
}

export function setSupabaseClient(client: SupabaseClient): void {
  instance = client;
}

export function getSupabase(): SupabaseClient {
  if (!instance) {
    throw new Error(
      '[@bnb/api] Supabase client not initialized. Call setSupabaseClient() at app startup.',
    );
  }
  return instance;
}
