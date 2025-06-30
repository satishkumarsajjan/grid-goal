'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useRef } from 'react';
import { Button } from '../ui/button';
import GridGoalLogo from './grid-goal-logo';
import ThemeSwitch from './theme-switch';
import JoinButton from './join';

gsap.registerPlugin(ScrollToPlugin);

export function Header() {
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.to(headerRef.current, {
        y: '0',
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.5,
      });

      const links = gsap.utils.toArray('.nav-link');
      // @ts-ignore
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
          <Button asChild>
            <JoinButton text='Join waitlist' />
          </Button>
        </div>
      </div>
    </header>
  );
}
