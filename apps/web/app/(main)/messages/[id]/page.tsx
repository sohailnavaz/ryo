'use client';
import { AuthGate, ThreadScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <AuthGate>
      <ThreadScreen threadId={params.id} />
    </AuthGate>
  );
}
