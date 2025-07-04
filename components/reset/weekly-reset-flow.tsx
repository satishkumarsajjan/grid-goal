'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/app-store';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { Button } from '../ui/button';
import { X, PartyPopper } from 'lucide-react';
import { StepCelebrate } from './step-celebrate';
import { StepReview } from './step-review';
import { StepPlan } from './step-plan';
import { toast } from 'sonner';

// Define the type for the steps
type ResetStep = 'celebrate' | 'review' | 'plan' | 'finished';

// The API function for the final step mutation
const completeResetAction = () =>
  axios.post('/api/user/actions', { action: 'COMPLETE_WEEKLY_RESET' });

export function WeeklyResetFlow() {
  const { isResetFlowActive, endResetFlow } = useAppStore();
  const [currentStep, setCurrentStep] = useState<ResetStep>('celebrate');
  const containerRef = useRef<HTMLDivElement>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  // GSAP context for animations
  const { contextSafe } = useGSAP({ scope: containerRef });

  // Mutation to mark the reset as complete on the server
  const completeMutation = useMutation({
    mutationFn: completeResetAction,
    onError: () => {
      // Even if this fails, we can still let the user finish.
      // It just means the prompt might show up again too soon.
      toast.error("Could not save reset status, but you're good to go!");
    },
  });

  // Animation function to transition between steps
  const animateToStep = contextSafe((nextStep: ResetStep) => {
    const tl = gsap.timeline({
      onComplete: () => setCurrentStep(nextStep),
    });
    tl.to(stepContainerRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in',
    });
    tl.set(stepContainerRef.current, { y: 20 }); // Move it below before fading in
    tl.to(stepContainerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  // Handler for the "Next" button
  const handleNext = () => {
    if (currentStep === 'celebrate') animateToStep('review');
    if (currentStep === 'review') animateToStep('plan');
    if (currentStep === 'plan') {
      // On the final step, call the mutation and transition to the 'finished' screen.
      completeMutation.mutate();
      animateToStep('finished');
    }
  };

  const handleClose = () => {
    // Here you could add a confirmation dialog if the user has made changes
    endResetFlow();
    // Reset to the first step for the next time it's opened
    setTimeout(() => setCurrentStep('celebrate'), 500);
  };

  if (!isResetFlowActive) {
    return null;
  }

  // Function to render the content of the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'celebrate':
        return <StepCelebrate />;
      case 'review':
        return <StepReview />;
      case 'plan':
        return <StepPlan />;
      case 'finished':
        return (
          <div className='text-center flex flex-col items-center justify-center h-64'>
            <PartyPopper className='h-16 w-16 text-primary mb-4' />
            <h2 className='text-3xl font-bold tracking-tight'>
              You're all set!
            </h2>
            <p className='mt-2 text-muted-foreground'>
              Have a productive and focused week.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
    >
      <div className='relative w-full max-w-3xl bg-card border rounded-lg shadow-xl flex flex-col'>
        <div className='p-6 border-b'>
          <h2 className='text-xl font-bold'>Weekly Reset</h2>
          <p className='text-sm text-muted-foreground'>
            Review last week and plan the next.
          </p>
        </div>

        <div ref={stepContainerRef} className='p-6 sm:p-8 flex-1'>
          {renderStep()}
        </div>

        <div className='p-6 border-t bg-background/50 flex items-center justify-between'>
          <Button variant='ghost' onClick={handleClose}>
            Close
          </Button>
          {currentStep !== 'finished' ? (
            <Button onClick={handleNext} disabled={completeMutation.isPending}>
              {currentStep === 'plan' ? 'Finish & Plan' : 'Next'}
            </Button>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </div>
      </div>
    </div>
  );
}
