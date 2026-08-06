import * as AppleAuthentication from 'expo-apple-authentication';

export type AppleCredential = { idToken: string; nonce?: string } | null;

/** Is native Sign in with Apple available? (iOS 13+; false on Android/older.) */
export async function isAppleAuthAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Present the OS Apple sheet; returns the identity token (for Supabase) or null. */
export async function signInWithApple(): Promise<AppleCredential> {
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    return cred.identityToken ? { idToken: cred.identityToken } : null;
  } catch (e) {
    // ERR_REQUEST_CANCELED when the user backs out — treat as a no-op.
    return null;
  }
}
