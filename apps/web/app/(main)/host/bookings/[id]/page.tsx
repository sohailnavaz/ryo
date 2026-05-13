'use client';
import { HostBookingDetailScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <HostBookingDetailScreen bookingId={params.id} />;
}
