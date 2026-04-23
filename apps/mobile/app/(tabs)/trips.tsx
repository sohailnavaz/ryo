import { AuthGate, TripsScreen } from '@bnb/features';

export default function Trips() {
  return (
    <AuthGate>
      <TripsScreen />
    </AuthGate>
  );
}
