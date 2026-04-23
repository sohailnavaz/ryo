'use client';
import { ListingScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <ListingScreen id={params.id} />;
}
