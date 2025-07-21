'use client';

import { Button } from '@/components/ui/button';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepConcept({ onNext, onBack }: StepProps) {
  return (
    <div className='text-center p-8 bg-card border rounded-lg shadow-xl'>
      <h1 className='text-3xl font-bold tracking-tight'>
        Everything Starts with a Goal
      </h1>
      <p className='mt-4 text-lg text-muted-foreground'>
        A Goal is your big objective. Tasks are the small, actionable steps to
        get there.
      </p>

      <div className='mt-8 p-4 border rounded-lg bg-background space-y-2'>
        <div className='p-3 bg-primary/10 text-primary font-bold rounded-md'>
          Goal: Launch My Podcast
        </div>
        <div className='p-2 border rounded-md text-sm'>
          Task: Buy Microphone
        </div>
        <div className='p-2 border rounded-md text-sm'>
          Task: Record First Episode
        </div>
        <div className='p-2 border rounded-md text-sm'>
          Task: Design Cover Art
        </div>
      </div>

      <div className='mt-8 flex justify-between'>
        <Button variant='ghost' onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
