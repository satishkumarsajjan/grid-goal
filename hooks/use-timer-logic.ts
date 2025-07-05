import { useSettingsStore } from '@/store/settings-store';
import { useTimerStore } from '@/store/timer-store';
import { useEffect, useMemo, useState } from 'react';

/**
 * Custom hook to manage the visual timer display and trigger pomodoro checks.
 * @returns The total elapsed time in milliseconds for display purposes.
 */
export function useTimerDisplay() {
  // Get all necessary state and actions from the stores
  const {
    isActive,
    accumulatedTime,
    intervalStartTime,
    mode,
    pomodoroCycle,
    tick,
  } = useTimerStore();
  const pomodoroSettings = useSettingsStore((state) => state.pomodoro);

  // This is the total time to be displayed on the UI
  const [displayMs, setDisplayMs] = useState(accumulatedTime);

  useEffect(() => {
    if (!isActive) {
      // When paused, the display time is exactly the accumulated time.
      setDisplayMs(accumulatedTime);
      return;
    }

    // If active, the display time is the accumulated time PLUS the current interval's progress.
    let animationFrameId: number;
    const updateTimer = () => {
      if (intervalStartTime) {
        setDisplayMs(accumulatedTime + (Date.now() - intervalStartTime));
      }
      // On every frame, also call the store's tick function to check for Pomodoro completion.
      tick();
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, intervalStartTime, accumulatedTime, tick]);

  // This memo is still useful for calculating the total duration of the current interval
  const currentIntervalDuration = useMemo(() => {
    if (mode !== 'POMODORO') return 0;
    switch (pomodoroCycle) {
      case 'WORK':
        return pomodoroSettings.durationWork * 1000;
      case 'SHORT_BREAK':
        return pomodoroSettings.durationShortBreak * 1000;
      case 'LONG_BREAK':
        return pomodoroSettings.durationLongBreak * 1000;
      default:
        return 0;
    }
  }, [mode, pomodoroCycle, pomodoroSettings]);

  return { displayMs, currentIntervalDuration };
}
