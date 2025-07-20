'use client';

import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';

interface StepProps {
  onFinish: () => void;
  goalTitle: string;
}

export function StepFinish({ onFinish, goalTitle }: StepProps) {
  return (
    <div className='text-center p-8 bg-card border rounded-lg shadow-xl'>
      <div className='mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-6'>
        <PartyPopper className='h-8 w-8 text-primary' />
      </div>
      <h1 className='text-3xl font-bold tracking-tight'>
        Great! Your Goal is Set.
      </h1>
      <p className='mt-4 text-lg text-muted-foreground'>
        You&apos;re ready to start breaking down &quot;{goalTitle}&quot; into
        actionable tasks.
      </p>
      <div className='mt-8 flex justify-center'>
        <Button onClick={onFinish} size='lg'>
          Finish & Go to My Goal
        </Button>
      </div>
    </div>
  );
}
