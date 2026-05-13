'use client';
import { HostListingEditScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <HostListingEditScreen listingId={params.id} />;
}
