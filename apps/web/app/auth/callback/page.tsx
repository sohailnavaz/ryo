'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tryGetSupabase } from '@bnb/api';

export default function Callback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = tryGetSupabase();
    if (!sb) {
      router.replace('/');
      return;
    }

    const finish = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errDesc = url.searchParams.get('error_description');
        if (errDesc) throw new Error(errDesc);

        if (code) {
          // PKCE flow (supabase-js v2 default): exchange the code for a session.
          // Requires the code-verifier saved in this browser when sign-in was
          // requested — so the magic link must be opened in the SAME browser.
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit / hash-token flow: detectSessionInUrl handles it; confirm.
          const { error } = await sb.auth.getSession();
          if (error) throw error;
        }

        // Confirm we actually have a session before leaving.
        const {
          data: { session },
        } = await sb.auth.getSession();
        router.replace(session ? '/account' : '/sign-in?error=no_session');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in could not be completed.');
      }
    };

    void finish();
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center text-ink-soft">
      {error ? (
        <>
          <p className="font-semibold text-ink">Sign-in didn’t complete</p>
          <p className="max-w-md text-sm">{error}</p>
          <p className="max-w-md text-sm">
            Tip: open the email link in the same browser you requested it from.
          </p>
          <a href="/sign-in" className="text-sm underline">
            Back to sign-in
          </a>
        </>
      ) : (
        <p>Signing you in…</p>
      )}
    </div>
  );
}
