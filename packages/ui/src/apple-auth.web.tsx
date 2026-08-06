export type AppleCredential = { idToken: string; nonce?: string } | null;

export async function isAppleAuthAvailable(): Promise<boolean> {
  return false; // web uses the OAuth redirect (useSignInWithApple), not the native sheet
}

export async function signInWithApple(): Promise<AppleCredential> {
  return null;
}
