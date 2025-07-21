import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useRef } from 'react';
import { SignInButton } from '../auth/sign-in-button';
import { SignOutButton } from '../auth/sign-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import JoinButton from './join';

type NavLink = {
  href: string;
  label: string;
};

type MobileNavProps = {
  isOpen: boolean;
  links: NavLink[];
  session: Session | null;
  handleLinkClick: (href: string) => void;
};

export function MobileNav({
  isOpen,
  links,
  session,
  handleLinkClick,
}: MobileNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(containerRef.current, {
        y: isOpen ? '0%' : '-100%',
        duration: 0.5,
        ease: 'power2.inOut',
      });
    },
    { dependencies: [isOpen] }
  );

  return (
    <div
      ref={containerRef}
      className='fixed top-0 left-0 w-full h-full bg-background/95 backdrop-blur-sm z-40 -translate-y-full lg:hidden'
    >
      <div className='container mx-auto px-6 h-full flex flex-col justify-center items-center'>
        <nav className='flex flex-col items-center gap-8 text-lg font-medium text-foreground'>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='nav-link hover:text-primary transition-colors'
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.href);
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className='absolute bottom-10 w-full flex flex-col items-center gap-4 px-6'>
          <div className='flex items-center justify-center gap-4'>
            {session?.user ? (
              <div className='flex items-center gap-2'>
                <Avatar>
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <SignOutButton />
              </div>
            ) : (
              <SignInButton />
            )}
            <JoinButton text='Get Started' />
          </div>
        </div>
      </div>
    </div>
  );
}
