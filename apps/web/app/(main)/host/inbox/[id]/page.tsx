'use client';
import { HostInboxThreadScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <HostInboxThreadScreen threadId={params.id} />;
}
