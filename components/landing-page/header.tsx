'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useRef } from 'react';
import { Button } from '../ui/button';
import GridGoalLogo from './grid-goal-logo';
import ThemeSwitch from './theme-switch';

gsap.registerPlugin(ScrollToPlugin);

export function Header() {
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Your existing animation for the header appearing
      gsap.from(headerRef.current, {
        y: '-100%',
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.5,
      });

      // --- Smooth Scroll Logic ---
      // 4. Select all elements with the 'nav-link' class inside the header
      const links = gsap.utils.toArray('.nav-link');

      links.forEach((link: any) => {
        link.addEventListener('click', (e: MouseEvent) => {
          e.preventDefault(); // Prevent the default browser jump
          const targetId = link.getAttribute('href');

          // Scroll to the target element
          gsap.to(window, {
            duration: 1.5,
            ease: 'power2.inOut',
            scrollTo: {
              y: targetId,
              // Add an offset to account for the fixed header's height
              // The header has h-16 (64px), so let's use a bit more for padding.
              offsetY: 80,
            },
          });
        });
      });
    },
    // The scope ensures GSAP only selects links within this component
    // and handles cleanup automatically when the component unmounts.
    { scope: headerRef }
  );

  return (
    <header
      ref={headerRef}
      className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-transparent transition-colors duration-300'
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
            {/* 3. Add the 'nav-link' class to the button's anchor tag */}
            <a href='#hero' className='nav-link'>
              Join Waitlist
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
