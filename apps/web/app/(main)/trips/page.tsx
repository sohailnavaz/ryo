'use client';
import { AuthGate, TripsScreen } from '@bnb/features';

export default function Page() {
  return (
    <AuthGate>
      <TripsScreen />
    </AuthGate>
  );
}
