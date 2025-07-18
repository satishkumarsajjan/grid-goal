'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ResetStepperProps {
  steps: { id: string; name: string }[];
  currentStepId: string;
}

// A single Step component for clarity
function Step({
  stepName,
  isCompleted,
  isCurrent,
}: {
  stepName: string;
  isCompleted: boolean;
  isCurrent: boolean;
}) {
  return (
    <div className='relative flex flex-col items-center justify-center'>
      {/* Circle Indicator */}
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300',
          isCompleted
            ? 'border-primary bg-primary text-primary-foreground'
            : '',
          isCurrent ? 'border-primary bg-background text-primary' : '',
          !isCompleted && !isCurrent
            ? 'border-border bg-background text-muted-foreground'
            : ''
        )}
        aria-current={isCurrent ? 'step' : undefined}
      >
        {isCompleted ? (
          <Check className='size-5' />
        ) : (
          <span
            className={cn(
              'flex size-2 rounded-full',
              isCurrent ? 'bg-primary' : 'bg-border'
            )}
          />
        )}
      </div>

      {/* Label */}
      <p
        className={cn(
          'mt-2 text-center text-xs font-medium transition-colors',
          isCurrent ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {stepName}
      </p>
    </div>
  );
}

export function ResetStepper({ steps, currentStepId }: ResetStepperProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <nav aria-label='Progress'>
      <div className='relative'>
        {/* The step indicators rendered on top */}
        <ol
          role='list'
          className='relative grid'
          style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
        >
          {steps.map((step, stepIdx) => (
            <li
              key={step.name}
              className={cn(
                'flex justify-start items-start',
                stepIdx === 1 && 'justify-center',
                stepIdx === 2 && 'justify-end'
              )}
            >
              <Step
                stepName={step.name}
                isCompleted={stepIdx < currentStepIndex}
                isCurrent={stepIdx === currentStepIndex}
              />
              {/* Screen-reader only text */}
              <span className='sr-only'>
                {stepIdx < currentStepIndex
                  ? `${step.name} (Completed)`
                  : stepIdx === currentStepIndex
                  ? `${step.name} (Current)`
                  : `${step.name} (Upcoming)`}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
