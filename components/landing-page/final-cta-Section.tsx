'use client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function FinalCTASection() {
  return (
    <section
      id='join'
      className='py-32 bg-muted/50 rounded-xl'
      aria-labelledby='cta-heading'
    >
      <div id='waitlist' className='container mx-auto px-6 text-center'>
        <h2 id='cta-heading' className='text-5xl font-bold tracking-tighter'>
          Want to build your grid?
        </h2>
        <p className='mt-6 text-lg text-muted-foreground max-w-md mx-auto'>
          Get notified when we launch. No spam, just a single email when we're
          live.
        </p>
        <div className='mt-8'>
          <form
            onSubmit={(e) => e.preventDefault()}
            className='hero-form mt-8 flex max-w-md mx-auto gap-2'
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
      </div>
    </section>
  );
}
