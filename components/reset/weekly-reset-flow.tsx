'use client';

import { useAppStore } from '@/store/app-store';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import gsap from 'gsap';
import { useRef, useState } from 'react';

import { PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { ResetStepper } from './reset-stepper';
import { StepCelebrate } from './step-celebrate';
import { StepPlan } from './step-plan';
import { StepReview } from './step-review';

type ResetStepId = 'celebrate' | 'review' | 'plan' | 'finished';
const STEPS = [
  {
    id: 'celebrate' as ResetStepId,
    name: 'Celebrate',
    component: StepCelebrate,
  },
  { id: 'review' as ResetStepId, name: 'Review', component: StepReview },
  { id: 'plan' as ResetStepId, name: 'Plan', component: StepPlan },
];

const completeResetAction = () =>
  axios.post('/api/user/actions', { action: 'COMPLETE_WEEKLY_RESET' });

export function WeeklyResetFlow() {
  const { isResetFlowActive, endResetFlow, incrementResetCompletionCount } =
    useAppStore();
  const [currentStepId, setCurrentStepId] = useState<ResetStepId>('celebrate');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const stepContainerRef = useRef<HTMLDivElement>(null);
  const headingRefs: Record<
    string,
    React.RefObject<HTMLHeadingElement | null>
  > = {
    celebrate: useRef<HTMLHeadingElement>(null),
    review: useRef<HTMLHeadingElement>(null),
    plan: useRef<HTMLHeadingElement>(null),
  };

  const completeMutation = useMutation({
    mutationFn: completeResetAction,
    onSuccess: () => {
      incrementResetCompletionCount();
    },
    onError: () => {
      toast.error("Could not save reset status, but you're good to go!");
    },
  });

  const animateAndSetStep = (nextStep: ResetStepId) => {
    gsap.to(stepContainerRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setCurrentStepId(nextStep);
        gsap.fromTo(
          stepContainerRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => {
              const ref = headingRefs[nextStep];
              ref?.current?.focus();
            },
          }
        );
      },
    });
  };

  const handleNext = () => {
    if (currentStepId === 'celebrate') animateAndSetStep('review');
    if (currentStepId === 'review') animateAndSetStep('plan');
    if (currentStepId === 'plan') {
      completeMutation.mutate();
      animateAndSetStep('finished');
    }
  };

  const handleBack = () => {
    if (currentStepId === 'review') animateAndSetStep('celebrate');
    if (currentStepId === 'plan') animateAndSetStep('review');
  };

  const attemptClose = () => {
    if (currentStepId === 'plan') {
      setShowCloseConfirm(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    endResetFlow();
    setTimeout(() => {
      setCurrentStepId('celebrate');
      setShowCloseConfirm(false);
    }, 300);
  };

  if (!isResetFlowActive) return null;

  const CurrentStepComponent = STEPS.find(
    (s) => s.id === currentStepId
  )?.component;

  return (
    <>
      <div className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
        <div className='relative w-full max-w-3xl bg-card border rounded-lg shadow-xl flex flex-col max-h-[90vh]'>
          <div className='p-6 border-b flex flex-col items-center gap-6'>
            <h2 className='text-xl font-bold'>Weekly Reset</h2>
            {currentStepId !== 'finished' && (
              <div className='w-full px-4 sm:px-8'>
                <ResetStepper steps={STEPS} currentStepId={currentStepId} />
              </div>
            )}
          </div>

          <div
            ref={stepContainerRef}
            className='p-6 sm:p-8 flex-1 overflow-y-auto'
          >
            {CurrentStepComponent ? (
              <CurrentStepComponent ref={headingRefs[currentStepId]} />
            ) : currentStepId === 'finished' ? (
              <div className='text-center flex flex-col items-center justify-center min-h-[300px]'>
                <PartyPopper className='h-16 w-16 text-primary mb-4' />
                <h2
                  tabIndex={-1}
                  className='text-3xl font-bold tracking-tight outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm'
                >
                  You're all set!
                </h2>
                <p className='mt-2 text-muted-foreground'>
                  Have a productive and focused week.
                </p>
              </div>
            ) : null}
          </div>

          <div className='p-6 border-t bg-background/50 flex items-center justify-between'>
            {currentStepId !== 'celebrate' && currentStepId !== 'finished' ? (
              <Button variant='ghost' onClick={handleBack}>
                Back
              </Button>
            ) : (
              <Button variant='ghost' onClick={attemptClose}>
                Close
              </Button>
            )}

            {currentStepId !== 'finished' ? (
              <Button
                onClick={handleNext}
                disabled={completeMutation.isPending}
              >
                {currentStepId === 'plan' ? 'Finish & Plan' : 'Next'}
              </Button>
            ) : (
              <Button onClick={handleClose}>Done</Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to close?</AlertDialogTitle>
            <AlertDialogDescription>
              You've started planning your week. If you close now, your selected
              queue will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Planning</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              className='bg-destructive hover:bg-destructive/90'
            >
              Close Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
