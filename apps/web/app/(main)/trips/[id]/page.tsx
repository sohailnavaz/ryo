'use client';
import { AuthGate, TripDetailScreen } from '@bnb/features';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AuthGate>
      <TripDetailScreen id={params.id} />
    </AuthGate>
  );
}
