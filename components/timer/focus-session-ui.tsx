'use client';

import { useState } from 'react';
import { useTimerStore } from '@/store/timer-store';
import { useTimerEngine } from '@/hooks/use-timer-engine';
import { calculateFinalDuration } from '@/lib/timer-machine';

import { SessionControls } from './session-controls';
import { SessionSummaryView } from '../session/session-summary-view';
import { SessionHeader } from './session-header';
import { TimerDisplay } from './timer-display';
import { PomodoroTransition } from './pomodoro-transition';
import { PomodoroCycle, TimerMode } from '@prisma/client';

export function FocusSessionUI() {
  // --- State from Global Store ---
  const { isActive, activeTask, mode, pomodoroCycle, reset } = useTimerStore();

  // --- Logic from Custom Hook ---
  const {
    displayTime,
    currentIntervalDuration,
    isTransitioning,
    transitionTo,
    startNextInterval,
    skipBreak,
  } = useTimerEngine();

  // --- Local UI State ---
  const [showSummary, setShowSummary] = useState(false);
  const [finalSessionData, setFinalSessionData] = useState<{
    durationSeconds: number;
    mode: TimerMode;
    pomodoroCycle: PomodoroCycle;
  } | null>(null);

  // --- Event Handlers ---
  const handleFinishSession = () => {
    const timerState = useTimerStore.getState();
    const finalDurationSeconds = calculateFinalDuration(timerState);

    if (
      timerState.mode === 'STOPWATCH' ||
      timerState.pomodoroCycle === 'WORK'
    ) {
      setFinalSessionData({
        durationSeconds: finalDurationSeconds,
        mode: timerState.mode,
        pomodoroCycle: timerState.pomodoroCycle,
      });
      setShowSummary(true);
    } else {
      reset();
    }
  };

  const handleSessionSavedOrDiscarded = () => {
    setShowSummary(false);
    setFinalSessionData(null);
    reset();
  };

  if (!activeTask) return null;

  // --- RENDER LOGIC ---
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
        {/* The PAUSED overlay - solves Flaw #10 */}
        {!isActive && (
          <div className='absolute inset-0 bg-black/10 dark:bg-black/30 flex items-center justify-center backdrop-blur-sm'>
            <span className='text-white text-2xl font-bold tracking-widest uppercase bg-black/50 px-4 py-2 rounded-lg'>
              Paused
            </span>
          </div>
        )}

        <SessionHeader
          taskTitle={activeTask.title}
          goalTitle={activeTask.goalTitle}
        />

        <TimerDisplay
          mode={mode}
          pomodoroCycle={pomodoroCycle}
          displayMs={displayTime}
          intervalDurationMs={currentIntervalDuration}
        />

        <div className='absolute bottom-16 flex gap-4'>
          <SessionControls onFinish={handleFinishSession} />
        </div>
      </div>

      {showSummary && finalSessionData && (
        <SessionSummaryView
          task={activeTask}
          sessionData={finalSessionData}
          onSessionSaved={handleSessionSavedOrDiscarded}
          onDiscard={handleSessionSavedOrDiscarded}
        />
      )}
    </>
  );
}
