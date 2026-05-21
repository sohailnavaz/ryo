'use client';
import { AuthGate, HostListingCreateScreen } from '@bnb/features';

export default function Page() {
  return (
    <AuthGate>
      <HostListingCreateScreen />
    </AuthGate>
  );
}
