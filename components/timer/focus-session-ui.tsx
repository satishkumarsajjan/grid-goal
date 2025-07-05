'use client';

import { useTimerDisplay } from '@/hooks/use-timer-logic';
import {
  useTimerStore,
  type PomodoroCycle,
  type TimerMode,
} from '@/store/timer-store';
import { useState } from 'react';

import { SessionSummaryView } from '../session/session-summary-view';
import { SessionControls } from './session-controls';
import { SessionHeader } from './session-header';
import { TimerDisplay } from './timer-display';

export function FocusSessionUI() {
  // --- State and Logic from Hooks ---
  // Get the state directly from the main store.
  const {
    activeTask,
    mode,
    pomodoroCycle,
    reset,
    // IMPORTANT: The function to get the final duration is now part of finishIntervalAndProceed
  } = useTimerStore();

  // Get the visual display time from our custom hook.
  const { displayMs, currentIntervalDuration } = useTimerDisplay();

  // --- Local UI State ---
  // This state is only for controlling the visibility of the summary view.
  const [showSummary, setShowSummary] = useState(false);

  // This state will hold the final, accurate data for the completed session.
  const [finalSessionData, setFinalSessionData] = useState<{
    durationSeconds: number;
    mode: TimerMode;
    pomodoroCycle: PomodoroCycle;
  } | null>(null);

  // --- Event Handlers ---

  /**
   * This function is now the single source of truth for finishing a session manually.
   * It calls the store's logic to get the final, accurate duration.
   */
  const handleFinishSession = () => {
    // We get a fresh reference to the store's state and actions here.
    const {
      finishIntervalAndProceed: finishAndProceed,
      mode: currentMode,
      pomodoroCycle: currentCycle,
    } = useTimerStore.getState();

    // The logic for calculating the duration is now entirely inside the store.
    // We just need to call the action that returns the final data.
    // For a manual stop, we will create a temporary action that doesn't proceed to the next pomodoro cycle.
    const { accumulatedTime, isActive, intervalStartTime } =
      useTimerStore.getState();
    let finalAccumulatedTime = accumulatedTime;
    if (isActive && intervalStartTime) {
      finalAccumulatedTime += Date.now() - intervalStartTime;
    }
    const finalDurationSeconds = Math.round(finalAccumulatedTime / 1000);

    const dataToLog = {
      durationSeconds: finalDurationSeconds,
      mode: currentMode,
      pomodoroCycle: currentCycle,
    };

    // We only show the summary if they finished a work session.
    // If they finish during a break, we just end the session.
    if (currentMode === 'STOPWATCH' || currentCycle === 'WORK') {
      setFinalSessionData(dataToLog);
      setShowSummary(true);
    } else {
      reset(); // Just discard the break and end the session.
    }
  };

  /**
   * This handler is called when the summary view is closed,
   * either by saving or discarding. It resets everything.
   */
  const handleSessionSavedOrDiscarded = () => {
    setShowSummary(false);
    setFinalSessionData(null);
    reset(); // Fully reset the global timer state.
  };

  // --- Render ---

  // This is a safeguard. The component shouldn't even be mounted if there's no active task,
  // thanks to our logic in layout.tsx.
  if (!activeTask) return null;

  return (
    <>
      {/* Main Timer / Zen Mode View */}
      <div
        className='fixed inset-0 bg-background z-40 flex flex-col items-center justify-center p-8 transition-all duration-300'
        style={{
          opacity: showSummary ? 0.2 : 1,
          filter: showSummary ? 'blur(8px)' : 'none',
          transform: showSummary ? 'scale(0.98)' : 'scale(1)',
          // Prevent interacting with the background timer UI when the summary is open
          pointerEvents: showSummary ? 'none' : 'auto',
        }}
      >
        <SessionHeader taskTitle={activeTask.title} />

        <TimerDisplay
          mode={mode}
          pomodoroCycle={pomodoroCycle}
          displayMs={displayMs}
          intervalDurationMs={currentIntervalDuration}
        />

        <div className='absolute bottom-16 flex gap-4'>
          <SessionControls onFinish={handleFinishSession} />
        </div>
      </div>

      {/* Summary View (conditionally rendered on top) */}
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
