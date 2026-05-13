'use client';
import { AdminBookingDetailScreen } from '@bnb/features';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <AdminBookingDetailScreen bookingId={params.id} />;
}
