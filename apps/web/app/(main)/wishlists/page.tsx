'use client';
import { AuthGate, FavoritesScreen } from '@bnb/features';

export default function Page() {
  return (
    <AuthGate>
      <FavoritesScreen />
    </AuthGate>
  );
}
