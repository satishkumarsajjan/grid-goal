'use client';

import { Button } from '@/components/ui/button';
import { Goal } from '@prisma/client';

import { OnboardingGoalForm } from './OnboardingGoalForm';

interface StepProps {
  onGoalCreated: (goal: Goal) => void;
  onBack: () => void;
}

export function StepAction({ onGoalCreated, onBack }: StepProps) {
  return (
    <div className='p-8 bg-card border rounded-lg shadow-xl'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold tracking-tight'>
          What&apos;s one thing you want to achieve?
        </h1>
        <p className='mt-2 text-muted-foreground'>
          Don&apos;t overthink it! This will be your first Goal.
        </p>
      </div>

      <div className='mt-8'>
        <OnboardingGoalForm onFinished={onGoalCreated} />
      </div>

      <div className='mt-8 flex justify-between'>
        <Button variant='ghost' onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
