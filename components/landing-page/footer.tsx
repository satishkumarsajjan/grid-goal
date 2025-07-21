import { GitHubLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import GridGoalLogo from './grid-goal-logo';
import XLogo from './x-logo';

export function Footer() {
  return (
    <footer className='border-border'>
      <div className='container mx-auto px-6 py-12 flex flex-col gap-4'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-8'>
          <GridGoalLogo />
          <div className='flex gap-6 text-muted-foreground items-center justify-center'>
            <Link
              href='https://x.com/iamsatish4564'
              className='hover:text-foreground transition-colors'
              target='_blank'
            >
              <XLogo className='h-8 w-8' />
            </Link>
            <Link
              href='https://github.com/satishkumarsajjan/grid-goal'
              className='hover:text-foreground transition-colors'
              target='_blank'
            >
              <GitHubLogoIcon className='h-6 w-6' />
            </Link>
          </div>
        </div>
        <div className='border-t border-border text-center md:text-left text-sm text-muted-foreground pt-4'>
          Built by SATISH_KUMAR
        </div>
      </div>
    </footer>
  );
}
