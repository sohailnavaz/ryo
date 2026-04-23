'use client';
import { SignInScreen } from '@bnb/features';

export default function Page() {
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
  return <SignInScreen redirectTo={redirectTo} />;
}
