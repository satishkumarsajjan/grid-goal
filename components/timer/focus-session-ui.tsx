'use client';

import { useState } from 'react';
import { useTimerStore } from '@/store/timer-store';
import { useTimerEngine } from '@/hooks/use-timer-engine';
import { useIdle } from '@/hooks/use-idle';
import { calculateFinalDuration } from '@/lib/timer-machine';

import { SessionControls } from './session-controls';
import { SessionSummaryView } from '../session/session-summary-view';
import { SessionHeader } from './session-header';
import { TimerDisplay } from './timer-display';
import { PomodoroTransition } from './pomodoro-transition';
import { PomodoroCycle, TimerMode } from '@prisma/client';
import { cn } from '@/lib/utils';

export function FocusSessionUI() {
  // Get the pause action directly from the store
  const { isActive, activeTask, mode, pomodoroCycle, reset, pauseSession } =
    useTimerStore();

  const {
    displayTime,
    currentIntervalDuration,
    isTransitioning,
    transitionTo,
    startNextInterval,
    skipBreak,
  } = useTimerEngine();

  const isIdle = useIdle(3000);

  const [showSummary, setShowSummary] = useState(false);
  const [finalSessionData, setFinalSessionData] = useState<{
    durationSeconds: number;
    mode: TimerMode;
    pomodoroCycle: PomodoroCycle;
  } | null>(null);

  const handleFinishSession = () => {
    // NEW: Pause the session first. This updates accumulatedTime and makes the action reversible.
    pauseSession();

    // Get the now-paused state to calculate the final duration accurately.
    const timerState = useTimerStore.getState();
    const finalDurationSeconds = calculateFinalDuration(timerState);

    setFinalSessionData({
      durationSeconds: finalDurationSeconds,
      mode: timerState.mode,
      pomodoroCycle: timerState.pomodoroCycle,
    });
    setShowSummary(true);

    console.log(
      'SESSION FINISHED. Total Duration (seconds):',
      finalDurationSeconds
    );
  };

  // NEW: Handler to simply close the summary view without ending the session.
  const handleCloseSummary = () => {
    setShowSummary(false);
  };

  const handleSessionEnd = () => {
    setShowSummary(false);
    setFinalSessionData(null);
    reset();
  };

  if (!activeTask) return null;

  if (isTransitioning && transitionTo) {
    return (
      <PomodoroTransition
        nextCycle={transitionTo}
        onStartNext={startNextInterval}
        onSkipBreak={skipBreak}
      />
    );
  }

  return (
    <>
      <div
        className='fixed inset-0 bg-background z-40 flex flex-col items-center justify-center p-8 transition-all duration-300'
        style={{
          opacity: showSummary ? 0.2 : 1,
          filter: showSummary ? 'blur(8px)' : 'none',
          transform: showSummary ? 'scale(0.98)' : 'scale(1)',
          pointerEvents: showSummary ? 'none' : 'auto',
        }}
      >
        {/* The "Paused" overlay will now correctly show if the user opens the summary */}
        {!isActive && (
          <div className='absolute inset-0 bg-black/10 dark:bg-black/30 flex items-center justify-center backdrop-blur-sm'>
            <span className='text-white text-2xl font-bold tracking-widest uppercase bg-black/50 px-4 py-2 rounded-lg'>
              Paused
            </span>
          </div>
        )}

        <div
          className={cn(
            'transition-opacity duration-500',
            isIdle && !showSummary ? 'opacity-0' : 'opacity-100'
          )}
        >
          <SessionHeader
            taskTitle={activeTask.title}
            goalTitle={activeTask.goalTitle}
          />
        </div>

        <TimerDisplay
          mode={mode}
          pomodoroCycle={pomodoroCycle}
          displayMs={displayTime}
          intervalDurationMs={currentIntervalDuration}
        />

        <div
          className={cn(
            'absolute bottom-16 flex gap-4 transition-opacity duration-500',
            isIdle && !showSummary ? 'opacity-0' : 'opacity-100'
          )}
        >
          <SessionControls onFinish={handleFinishSession} />
        </div>
      </div>

      {showSummary && finalSessionData && (
        <SessionSummaryView
          task={activeTask}
          sessionData={finalSessionData}
          onSessionSaved={handleSessionEnd}
          onSessionDiscarded={handleSessionEnd}
          // NEW: Pass the close handler
          onClose={handleCloseSummary}
        />
      )}
    </>
  );
}
