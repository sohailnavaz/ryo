import { AuthGate, FavoritesScreen } from '@bnb/features';

export default function Wishlists() {
  return (
    <AuthGate>
      <FavoritesScreen />
    </AuthGate>
  );
}
