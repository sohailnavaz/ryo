'use client';
import { AuthGate, BookingScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <AuthGate>
      <BookingScreen id={params.id} />
    </AuthGate>
  );
}
