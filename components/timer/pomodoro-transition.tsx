'use client';

import { type PomodoroCycle } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Coffee, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

interface PomodoroTransitionProps {
  nextCycle: PomodoroCycle;
  onStartNext: () => void;
  onSkipBreak: () => void;
}

export function PomodoroTransition({
  nextCycle,
  onStartNext,
  onSkipBreak,
}: PomodoroTransitionProps) {
  const isBreak = nextCycle.includes('BREAK');

  const messages = {
    SHORT_BREAK: {
      title: 'Great work!',
      subtitle: 'Time for a short break.',
      icon: <Coffee className='h-16 w-16 mb-4 text-primary' />,
    },
    LONG_BREAK: {
      title: 'Cycle complete!',
      subtitle: 'Time for a well-deserved long break.',
      icon: <Coffee className='h-16 w-16 mb-4 text-primary' />,
    },
    WORK: {
      title: "Break's over!",
      subtitle: 'Ready for the next focus session?',
      icon: <Briefcase className='h-16 w-16 mb-4 text-primary' />,
    },
  };

  const { title, subtitle, icon } = messages[nextCycle];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className='fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center p-8'
    >
      <div className='mb-8'>
        {icon}
        <h1 className='text-4xl font-bold tracking-tight'>{title}</h1>
        <p className='text-xl text-muted-foreground mt-2'>{subtitle}</p>
      </div>
      <div className='flex flex-col sm:flex-row gap-4'>
        <Button onClick={onStartNext} size='lg' className='px-8 py-6 text-lg'>
          Start {nextCycle.replace('_', ' ').toLowerCase()}
        </Button>
        {isBreak && (
          <Button onClick={onSkipBreak} variant='ghost' size='lg'>
            Skip Break
          </Button>
        )}
      </div>
    </motion.div>
  );
}
