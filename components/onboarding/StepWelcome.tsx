'use client';

import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface StepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepWelcome({ onNext, onSkip }: StepProps) {
  return (
    <div className='text-center p-8 bg-card border rounded-lg shadow-xl'>
      <div className='mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-6'>
        <Rocket className='h-8 w-8 text-primary' />
      </div>
      <h1 className='text-3xl font-bold tracking-tight'>
        Welcome to GridGoal!
      </h1>
      <p className='mt-4 text-lg text-muted-foreground'>
        Let's turn your ambitions into achievements, one step at a time.
      </p>
      <div className='mt-8 flex flex-col sm:flex-row justify-center gap-4'>
        <Button onClick={onNext} size='lg'>
          Get Started
        </Button>
        <Button variant='ghost' onClick={onSkip}>
          Skip Onboarding
        </Button>
      </div>
    </div>
  );
}
