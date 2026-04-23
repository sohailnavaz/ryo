import { ListingScreen } from '@bnb/features';
import { useLocalSearchParams } from 'expo-router';

export default function Listing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListingScreen id={id as string} />;
}
