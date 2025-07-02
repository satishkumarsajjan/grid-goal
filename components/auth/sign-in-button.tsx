import { signInWithGoogle } from '@/lib/auth/actions';
import { Button } from '../ui/button';

export function SignInButton() {
  return (
    <form action={signInWithGoogle}>
      <Button type='submit'>Sign in with Google</Button>
    </form>
  );
}
