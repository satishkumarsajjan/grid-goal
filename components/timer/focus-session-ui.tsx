'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet'; // Import Sheet components here
import { useTimerStore } from '@/store/timer-store';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SessionSummaryPanel } from '../session/session-summary-panel';

// Helper to format seconds into MM:SS format for the timer display
const formatTimer = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// API function to fetch task title
const fetchTaskTitle = async (taskId: string) => {
  const { data } = await axios.get(`/api/tasks/${taskId}`);
  return data.title;
};

export function FocusSessionUI() {
  const {
    isActive,
    elapsedTime,
    activeTaskId,
    activeGoalId,
    mode,
    pomodoroState,
    stopSession,
    tick,
    nextPomodoroStep,
  } = useTimerStore();

  const [showSummary, setShowSummary] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);

  const { data: taskTitle } = useQuery({
    queryKey: ['task', activeTaskId],
    queryFn: () => fetchTaskTitle(activeTaskId!),
    enabled: !!activeTaskId,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, tick]);

  const handleStop = () => {
    // For Pomodoro, we only log the completed 'work' intervals.
    // The duration is fixed at 25 mins (or whatever is configured).
    const workDuration =
      mode === 'pomodoro' ? 25 * 60 : Math.round(elapsedTime / 1000); // For stopwatch, it's the elapsed time.

    setFinalDuration(workDuration);
    setShowSummary(true);
  };

  const handleSessionSaved = () => {
    setShowSummary(false); // Hide the panel
    stopSession(); // Fully reset the global timer state
  };

  const renderPomodoroUI = () => {
    if (!isActive && elapsedTime <= 0) {
      return (
        <div className='text-center'>
          <h2 className='text-2xl font-semibold mb-4'>
            {pomodoroState === 'work' ? 'Time for a break!' : 'Ready to focus?'}
          </h2>
          <div className='flex gap-4 justify-center'>
            <Button onClick={nextPomodoroStep} size='lg'>
              <Play className='mr-2 h-5 w-5' />
              Start {pomodoroState === 'work' ? 'Short Break' : 'Next Pomodoro'}
            </Button>
            <Button variant='ghost' onClick={handleStop} size='lg'>
              End Session
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className='text-center'>
        <p className='text-2xl font-medium text-muted-foreground capitalize mb-2'>
          {pomodoroState.replace('_', ' ')}
        </p>
        <h1 className='text-8xl md:text-9xl font-bold font-mono tracking-tighter'>
          {formatTimer(elapsedTime)}
        </h1>
      </div>
    );
  };

  const renderStopwatchUI = () => (
    <div className='text-center'>
      <p className='text-2xl font-medium text-muted-foreground mb-2'>
        Focusing
      </p>
      <h1 className='text-8xl md:text-9xl font-bold font-mono tracking-tighter'>
        {formatTimer(elapsedTime / 1000)}
      </h1>
    </div>
  );

  return (
    <div className='fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8'>
      {/* Zen Mode UI */}
      <>
        <div className='absolute top-8 text-center'>
          <p className='text-muted-foreground'>Working on:</p>
          <h3 className='text-xl font-semibold'>
            {taskTitle || 'Loading task...'}
          </h3>
        </div>

        {mode === 'pomodoro' ? renderPomodoroUI() : renderStopwatchUI()}

        <div className='absolute bottom-8 flex gap-4'>
          {mode === 'stopwatch' && (
            <Button variant='secondary' size='lg' onClick={handleStop}>
              Stop Session
            </Button>
          )}
        </div>
      </>

      {/* The Sheet component now lives here and controls the summary panel */}
      <Sheet
        open={showSummary}
        onOpenChange={(open) => {
          if (!open) handleSessionSaved();
        }}
      >
        <SheetContent className='flex flex-col w-full max-w-md p-0'>
          {/* We only render the panel's content when the sheet is open */}
          {showSummary && (
            <SessionSummaryPanel
              taskId={activeTaskId!}
              goalId={activeGoalId!}
              durationSeconds={finalDuration}
              onSessionSaved={handleSessionSaved}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
