import * as Linking from 'expo-linking';
import { SignInScreen } from '@bnb/features';

export default function SignIn() {
  const redirectTo = Linking.createURL('/auth/callback');
  return <SignInScreen redirectTo={redirectTo} />;
}
