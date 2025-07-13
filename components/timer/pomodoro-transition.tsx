'use client';

import { type PomodoroCycle } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Coffee, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/store/settings-store';

interface PomodoroTransitionProps {
  nextCycle: PomodoroCycle;
  onStartNext: () => void;
  onSkipBreak: () => void;
  onEndSession: () => void;
}

export function PomodoroTransition({
  nextCycle,
  onStartNext,
  onSkipBreak,
  onEndSession,
}: PomodoroTransitionProps) {
  const isBreak = nextCycle.includes('BREAK');
  const pomodoroSettings = useSettingsStore((state) => state.pomodoro);

  const getDurationInMinutes = (cycle: PomodoroCycle): number => {
    switch (cycle) {
      case 'WORK':
        return pomodoroSettings.durationWork / 60;
      case 'SHORT_BREAK':
        return pomodoroSettings.durationShortBreak / 60;
      case 'LONG_BREAK':
        return pomodoroSettings.durationLongBreak / 60;
      default:
        return 0;
    }
  };

  const durationMinutes = getDurationInMinutes(nextCycle);
  const cycleName = nextCycle.replace('_', ' ').toLowerCase();

  const messages = {
    SHORT_BREAK: {
      title: 'Great work!',
      subtitle: `Time for a ${durationMinutes}-minute short break.`,
      icon: <Coffee className='h-16 w-16 mb-4 text-primary' />,
    },
    LONG_BREAK: {
      title: 'Cycle complete!',
      subtitle: `Time for a well-deserved ${durationMinutes}-minute long break.`,
      icon: <Coffee className='h-16 w-16 mb-4 text-primary' />,
    },
    WORK: {
      title: "Break's over!",
      subtitle: `Ready for the next ${durationMinutes}-minute focus session?`,
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
      <div className='flex flex-col items-center gap-4'>
        <Button onClick={onStartNext} size='lg' className='px-8 py-6 text-lg'>
          Start {durationMinutes}min {cycleName}
        </Button>

        <div className='flex items-center gap-4 mt-2'>
          {isBreak && (
            <Button onClick={onSkipBreak} variant='ghost' size='lg'>
              Skip Break
            </Button>
          )}

          <Button
            onClick={onEndSession}
            variant='ghost'
            size='lg'
            className='text-muted-foreground hover:text-destructive'
          >
            End Session
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
