'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ResetStepperProps {
  steps: { id: string; name: string }[];
  currentStepId: string;
}

export function ResetStepper({ steps, currentStepId }: ResetStepperProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <nav aria-label='Progress'>
      <ol role='list' className='flex items-center'>
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              'relative',
              // Use padding on the container instead of the connector for more robust spacing
              stepIdx !== steps.length - 1 ? 'flex-1' : ''
            )}
          >
            {/* The colored bar connecting the steps */}
            <div
              className='absolute left-4 top-1/2 -ml-px mt-0.5 h-0.5 w-full transition-colors duration-300'
              aria-hidden='true'
              // The connector is colored if the *previous* step is complete
              style={{
                backgroundColor:
                  stepIdx <= currentStepIndex
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--border))',
              }}
            />

            <div className='relative flex items-center justify-start'>
              {/* Step Indicator Circle */}
              <div
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
                  stepIdx < currentStepIndex
                    ? 'bg-primary cursor-pointer hover:bg-primary/90'
                    : '',
                  stepIdx === currentStepIndex
                    ? 'border-2 border-primary bg-background'
                    : '',
                  stepIdx > currentStepIndex
                    ? 'border-2 border-border bg-background'
                    : ''
                )}
                aria-current={stepIdx === currentStepIndex ? 'step' : undefined}
              >
                {stepIdx < currentStepIndex ? (
                  <Check className='h-5 w-5 text-primary-foreground' />
                ) : (
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-colors duration-300',
                      stepIdx === currentStepIndex ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>

              {/* Step Name Label */}
              <span
                className={cn(
                  'ml-4 text-sm font-medium',
                  stepIdx <= currentStepIndex
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {step.name}
              </span>

              {/* Screen-reader only text for better accessibility */}
              <span className='sr-only'>
                {stepIdx < currentStepIndex
                  ? `${step.name} - Completed`
                  : stepIdx === currentStepIndex
                  ? `${step.name} - Current`
                  : `${step.name} - Upcoming`}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
