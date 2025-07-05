import { useState, useEffect, useMemo } from 'react';
import {
  useTimerStore,
  type TimerMode,
  type PomodoroCycle,
} from '@/store/timer-store';
import { useSettingsStore } from '@/store/settings-store';
import { toast } from 'sonner';

// A simple function to play a notification sound
const playSound = (sound: 'work' | 'break') => {
  console.log(`Playing sound for: ${sound}`);
  // In a real app, you'd have audio files in /public
  // const audio = new Audio(`/sounds/${sound}-start.mp3`);
  // audio.play().catch(e => console.error("Error playing sound:", e));
};

/**
 * Custom hook to manage the visual timer display.
 * It uses requestAnimationFrame for a smooth, efficient countdown/up.
 * @param isActive - Whether the timer is currently running.
 * @param startTime - The UTC timestamp of when the timer started.
 * @returns The elapsed time in milliseconds.
 */
export function useTimerDisplay(isActive: boolean, startTime: number | null) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) {
      // If paused or stopped, ensure display doesn't change
      return;
    }

    let animationFrameId: number;
    const updateTimer = () => {
      setElapsedMs(Date.now() - startTime);
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, startTime]);

  return elapsedMs;
}

/**
 * Custom hook to handle the logic for automatically transitioning
 * between Pomodoro cycles.
 */
export function usePomodoroAutomation() {
  const { isActive, startTime, mode, pomodoroCycle, finishIntervalAndProceed } =
    useTimerStore();
  const pomodoroSettings = useSettingsStore((state) => state.pomodoro);

  const currentIntervalDuration = useMemo(() => {
    if (mode !== 'POMODORO') return Infinity; // Stopwatch never ends
    switch (pomodoroCycle) {
      case 'WORK':
        return pomodoroSettings.durationWork * 1000;
      case 'SHORT_BREAK':
        return pomodoroSettings.durationShortBreak * 1000;
      case 'LONG_BREAK':
        return pomodoroSettings.durationLongBreak * 1000;
    }
  }, [mode, pomodoroCycle, pomodoroSettings]);

  useEffect(() => {
    if (isActive && startTime && mode === 'POMODORO') {
      const elapsed = Date.now() - startTime;
      if (elapsed >= currentIntervalDuration) {
        // Log the finished work interval
        if (pomodoroCycle === 'WORK') {
          toast.success('Work interval complete!');
          // You would call a server action here to log this interval automatically
          console.log('LOGGING FINISHED WORK INTERVAL');
          playSound('break');
        } else {
          playSound('work');
        }

        // Proceed to the next step automatically
        finishIntervalAndProceed();
      }
    }
  }, [
    isActive,
    startTime,
    mode,
    pomodoroCycle,
    currentIntervalDuration,
    finishIntervalAndProceed,
  ]);

  return { currentIntervalDuration };
}
