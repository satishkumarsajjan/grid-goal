/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useSession } from 'next-auth/react';
import { useRef } from 'react';
import { SignInButton } from '../auth/sign-in-button';
import { SignOutButton } from '../auth/sign-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import GridGoalLogo from './grid-goal-logo';
import JoinButton from './join';
import ThemeSwitch from './theme-switch';

gsap.registerPlugin(ScrollToPlugin);

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const { data } = useSession();
  useGSAP(
    () => {
      gsap.to(headerRef.current, {
        y: '0',
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.3,
      });

      const links = gsap.utils.toArray('.nav-link');
      links.forEach((link: any) => {
        link.addEventListener('click', (e: MouseEvent) => {
          e.preventDefault();
          const targetId = link.getAttribute('href');

          gsap.to(window, {
            duration: 1.5,
            ease: 'power2.inOut',
            scrollTo: {
              y: targetId,
              offsetY: 80,
            },
          });
        });
      });
    },

    { scope: headerRef }
  );

  return (
    <header
      ref={headerRef}
      className='fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-transparent transition-colors duration-300 -translate-y-[100%]'
    >
      <div className='container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl'>
        <GridGoalLogo />

        <nav className='hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground'>
          <a
            href='#hero'
            className='nav-link hover:text-primary transition-colors'
          >
            Home
          </a>
          <a
            href='#workflow'
            className='nav-link hover:text-primary transition-colors'
          >
            About
          </a>
          <a
            href='#features'
            className='nav-link hover:text-primary transition-colors'
          >
            Features
          </a>
          <a
            href='#insights'
            className='nav-link hover:text-primary transition-colors'
          >
            Insights
          </a>

          <a
            href='#awards'
            className='nav-link hover:text-primary transition-colors'
          >
            Trophy Case
          </a>
          <a
            href='#testimonials'
            className='nav-link hover:text-primary transition-colors'
          >
            Testimonials
          </a>
          <a
            href='#join'
            className='nav-link hover:text-primary transition-colors'
          >
            Join
          </a>
        </nav>
        <div className='flex items-center gap-2'>
          <ThemeSwitch />
          {data?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  <AvatarImage src={data.user.image ?? undefined} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignInButton />
          )}
          <JoinButton text='Get Started' />
        </div>
      </div>
    </header>
  );
}
