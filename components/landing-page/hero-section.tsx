'use client';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import gsap from 'gsap';

export function HeroSection() {
  const container = useRef(null);
  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.8 });
      tl.to('.hero-h1', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
      })
        .to(
          '.hero-p',
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
          '-=0.4'
        )
        .to(
          '.hero-form',
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
          '-=0.3'
        );
    },
    { scope: container }
  );

  return (
    <section ref={container} id='hero' className='pt-40 pb-16 text-center'>
      <div className='container mx-auto px-6'>
        <h1 className='hero-h1 opacity-0 translate-y-[20px] text-5xl md:text-7xl font-bold tracking-tighter leading-tight max-w-4xl mx-auto bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70'>
          All of the Progress, None of the Bloat
        </h1>
        <p className='hero-p mt-6 text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 translate-y-[20px]'>
          Manage your goals and tasks. Visualize your dedication. GridGoal helps
          you create goals and track consistency, grid by grid. Stop guessing.
          Start achieving.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className='hero-form mt-8 flex max-w-md mx-auto gap-2 opacity-0 translate-y-[20px]'
        >
          <label htmlFor='email-waitlist' className='sr-only'>
            Enter your email to join the waitlist
          </label>
          <Input
            id='email-waitlist'
            type='email'
            placeholder='Enter your email'
            required
            className='flex-1'
          />
          <Button
            type='submit'
            className='shadow-primary/20 shadow-[0_4px_15px]'
          >
            Join the Waitlist
          </Button>
        </form>
      </div>
    </section>
  );
}
