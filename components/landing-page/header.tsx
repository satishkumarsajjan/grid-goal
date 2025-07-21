// @/components/layout/header.tsx (Updated)

'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Menu, X } from 'lucide-react'; // <-- Import icons
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRef, useState } from 'react'; // <-- Import useState
import { SignInButton } from '../auth/sign-in-button';
import { SignOutButton } from '../auth/sign-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import GridGoalLogo from './grid-goal-logo';
import JoinButton from './join';
import { MobileNav } from './mobile-nav'; // <-- Import MobileNav
import ThemeSwitch from './theme-switch';

gsap.registerPlugin(ScrollToPlugin);

// Define nav links in one place for reusability
const navLinks = [
  { href: '#hero', label: 'Home' },
  { href: '#workflow', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#insights', label: 'Insights' },
  { href: '#awards', label: 'Trophy Case' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#join', label: 'Join' },
];

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = (targetId: string) => {
    setIsMenuOpen(false);
    gsap.to(window, {
      duration: 1.5,
      ease: 'power2.inOut',
      scrollTo: {
        y: targetId,
        offsetY: 80,
      },
    });
  };

  useGSAP(
    () => {
      gsap.to(headerRef.current, {
        y: '0',
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.3,
      });

      const links = gsap.utils.toArray('.desktop-nav-link');
      links.forEach((link: any) => {
        link.addEventListener('click', (e: MouseEvent) => {
          e.preventDefault();
          const targetId = link.getAttribute('href');
          handleLinkClick(targetId);
        });
      });
    },
    { scope: headerRef }
  );

  return (
    <>
      <header
        ref={headerRef}
        className='fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-transparent transition-colors duration-300 -translate-y-[100%]'
      >
        <div className='container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl'>
          <Link
            href='#hero'
            aria-label='Scroll to top'
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('#hero');
            }}
          >
            <GridGoalLogo />
          </Link>

          {/* --- Desktop Navigation --- */}
          <nav className='hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground'>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                // Added a specific class for desktop to avoid conflicting selectors
                className='desktop-nav-link hover:text-primary transition-colors'
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* --- Right-side Actions (Desktop) --- */}
          <div className='hidden lg:flex items-center gap-2'>
            <ThemeSwitch />

            <JoinButton text='Get Started' />
          </div>

          {/* --- Mobile Hamburger Menu Button --- */}
          <div className='flex items-center gap-2 lg:hidden'>
            <ThemeSwitch /> {/* Keep theme switch visible if desired */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='p-2'
              aria-label='Toggle navigation menu'
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* --- Render the Mobile Navigation Menu --- */}
      <MobileNav
        isOpen={isMenuOpen}
        links={navLinks}
        session={session}
        handleLinkClick={handleLinkClick}
      />
    </>
  );
}
