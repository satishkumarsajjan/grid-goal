import { signOutAction } from '@/lib/auth/actions';
import { Button } from '../ui/button';

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type='submit' variant={'ghost'}>
        Sign Out
      </Button>
    </form>
  );
}
