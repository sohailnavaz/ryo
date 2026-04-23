import { AuthGate, BookingScreen } from '@bnb/features';
import { useLocalSearchParams } from 'expo-router';

export default function Booking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AuthGate>
      <BookingScreen id={id as string} />
    </AuthGate>
  );
}
