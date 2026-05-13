'use client';
import { AuthGate, TripDetailScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <AuthGate>
      <TripDetailScreen id={params.id} />
    </AuthGate>
  );
}
