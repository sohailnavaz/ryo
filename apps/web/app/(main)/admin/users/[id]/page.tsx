'use client';
import { AdminUserDetailScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <AdminUserDetailScreen userId={params.id} />;
}
