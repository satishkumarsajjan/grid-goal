'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { StepCelebrate } from './step-celebrate';
import { StepReview } from './step-review';

// We'll create these components in the next steps
// import { StepCelebrate } from './step-celebrate';
// import { StepReview } from './step-review';
// import { StepPlan } from './step-plan';

type ResetStep = 'celebrate' | 'review' | 'plan' | 'finished';

export function WeeklyResetFlow() {
  const { isResetFlowActive, endResetFlow } = useAppStore();
  const [currentStep, setCurrentStep] = useState<ResetStep>('celebrate');
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);

  // GSAP context for animations
  const { contextSafe } = useGSAP({ scope: containerRef });

  const animateToStep = contextSafe((nextStep: ResetStep) => {
    const tl = gsap.timeline({
      onComplete: () => setCurrentStep(nextStep),
    });
    tl.to(stepRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in',
    });
    tl.to(stepRef.current, {
      y: 20,
      duration: 0,
    });
    tl.to(stepRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  const handleNext = () => {
    if (currentStep === 'celebrate') animateToStep('review');
    if (currentStep === 'review') animateToStep('plan');
    if (currentStep === 'plan') {
      // TODO: Call the mutation to update the user's lastResetAt timestamp
      animateToStep('finished');
    }
  };

  const handleClose = () => {
    // You might want a confirmation dialog here
    endResetFlow();
  };

  if (!isResetFlowActive) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'celebrate':
        return <StepCelebrate />;
      case 'review':
        return <StepReview />;
      case 'plan':
        return <div>Plan Step Content</div>; // Placeholder
      case 'finished':
        return (
          <div className='text-center'>
            <h2 className='text-2xl font-bold'>You're all set for the week!</h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center'
    >
      <div className='relative w-full max-w-2xl bg-card border rounded-lg shadow-xl p-8'>
        <Button
          variant='ghost'
          size='icon'
          className='absolute top-4 right-4'
          onClick={handleClose}
        >
          <X className='h-4 w-4' />
        </Button>

        <div ref={stepRef}>{renderStep()}</div>

        <div className='mt-8 flex justify-end'>
          {currentStep !== 'finished' ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={endResetFlow}>Finish</Button>
          )}
        </div>
      </div>
    </div>
  );
}
