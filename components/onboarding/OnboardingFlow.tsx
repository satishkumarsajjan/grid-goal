'use client';

import { useOnboardingStore } from '@/store/onboarding-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Goal } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { StepAction } from './StepAction';
import { StepConcept } from './StepConcept';
import { StepFinish } from './StepFinish';
import { StepWelcome } from './StepWelcome';

type OnboardingStep = 'welcome' | 'concept' | 'action' | 'finish';

const completeOnboardingAction = () =>
  axios.post('/api/user/actions', { action: 'COMPLETE_ONBOARDING' });

export function OnboardingFlow() {
  const { isOnboardingActive, endOnboarding } = useOnboardingStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [createdGoal, setCreatedGoal] = useState<Goal | null>(null);

  const completeMutation = useMutation({
    mutationFn: completeOnboardingAction,
    onError: () => {
      console.error('Failed to save onboarding status.');
    },
  });

  const handleNext = () => {
    if (currentStep === 'welcome') setCurrentStep('concept');
    if (currentStep === 'concept') setCurrentStep('action');
  };

  const handleGoalCreated = (goal: Goal) => {
    setCreatedGoal(goal);
    // When the goal is created, also mark the onboarding as complete on the server.
    completeMutation.mutate();
    // Invalidate goal queries so the app feels fresh after onboarding
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    setCurrentStep('finish');
  };

  const handleFinish = () => {
    endOnboarding();
    // Navigate the user directly to their newly created goal
    if (createdGoal) {
      router.push(`/goals/${createdGoal.id}`);
    }
  };

  const handleSkip = () => {
    completeMutation.mutate();
    endOnboarding();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <StepWelcome onNext={handleNext} onSkip={handleSkip} />;
      case 'concept':
        return (
          <StepConcept
            onNext={handleNext}
            onBack={() => setCurrentStep('welcome')}
          />
        );
      case 'action':
        return (
          <StepAction
            onGoalCreated={handleGoalCreated}
            onBack={() => setCurrentStep('concept')}
          />
        );
      case 'finish':
        return (
          <StepFinish
            onFinish={handleFinish}
            goalTitle={createdGoal?.title || 'your new goal'}
          />
        );
      default:
        return null;
    }
  };

  if (!isOnboardingActive) return null;

  return (
    <div className='fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className='w-full max-w-lg'
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
