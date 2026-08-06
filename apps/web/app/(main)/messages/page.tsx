'use client';
import { AuthGate, MessagesScreen } from '@bnb/features';

export default function Page() {
  return (
    <AuthGate>
      <MessagesScreen />
    </AuthGate>
  );
}
