'use client';

import { useState } from 'react';
import {
  useTimerStore,
  type TimerMode,
  type PomodoroCycle,
} from '@/store/timer-store';
import {
  useTimerDisplay,
  usePomodoroAutomation,
} from '@/hooks/use-timer-logic';

import { SessionControls } from './session-controls';
import { SessionSummaryView } from '../session/session-summary-view';
import { SessionHeader } from './session-header';
import { TimerDisplay } from './timer-display';

export function FocusSessionUI() {
  // --- State and Logic from Hooks ---
  const { isActive, startTime, activeTask, mode, pomodoroCycle, reset } =
    useTimerStore();
  const displayTimeMs = useTimerDisplay(isActive, startTime);
  const { currentIntervalDuration } = usePomodoroAutomation();

  // --- Local UI State ---
  const [showSummary, setShowSummary] = useState(false);
  const [finalSessionData, setFinalSessionData] = useState<{
    durationSeconds: number;
    mode: TimerMode;
    pomodoroCycle: PomodoroCycle;
  } | null>(null);

  // --- Event Handlers ---
  const handleFinishSession = () => {
    const durationSeconds = Math.round(
      (Date.now() - (startTime ?? Date.now())) / 1000
    );

    if (mode === 'STOPWATCH' || pomodoroCycle === 'WORK') {
      setFinalSessionData({ durationSeconds, mode, pomodoroCycle });
      setShowSummary(true);
    } else {
      reset(); // Discard breaks if finishing the session
    }
  };

  const handleSessionSavedOrDiscarded = () => {
    setShowSummary(false);
    setFinalSessionData(null);
    reset();
  };

  // --- Render ---
  if (!activeTask) return null; // Don't render if there's no active task context

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
        <SessionHeader taskTitle={activeTask.title} />

        <TimerDisplay
          mode={mode}
          pomodoroCycle={pomodoroCycle}
          displayMs={displayTimeMs}
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
