import { calculateNextPomodoroState } from '@/lib/timer-machine';
import { useSettingsStore } from '@/store/settings-store';
import { useTimerStore } from '@/store/timer-store';
import type { PomodoroCycle } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// This hook encapsulates all the complex, real-time logic of the timer.
export function useTimerEngine() {
  // --- State from Stores ---
  // We use getState() inside effects to avoid stale closures, and selectors for rendering
  const setTimerState = useTimerStore.setState;
  const pomodoroSettings = useSettingsStore((state) => state.pomodoro);

  // --- Local State for UI ---
  // This state holds the raw elapsed time for the current interval
  const [currentIntervalElapsed, setCurrentIntervalElapsed] = useState(0);

  // A new state to control the "Transition View"
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTo, setTransitionTo] = useState<PomodoroCycle | null>(null);

  // --- Memos for Derived Data ---
  // We use a selector to get the values needed for display
  const { isActive, accumulatedTime, intervalStartTime, mode, pomodoroCycle } =
    useTimerStore();
  const displayTime = accumulatedTime + currentIntervalElapsed;

  const currentIntervalDuration = useMemo(() => {
    if (mode !== 'POMODORO') return Infinity; // Stopwatch never ends on its own
    switch (pomodoroCycle) {
      case 'WORK':
        return pomodoroSettings.durationWork * 1000;
      case 'SHORT_BREAK':
        return pomodoroSettings.durationShortBreak * 1000;
      case 'LONG_BREAK':
        return pomodoroSettings.durationLongBreak * 1000;
      default:
        return Infinity;
    }
  }, [mode, pomodoroCycle, pomodoroSettings]);

  // --- Core Timer Loop ---
  useEffect(() => {
    // This effect handles the timer tick and pomodoro transition logic
    if (!isActive || !intervalStartTime) {
      setCurrentIntervalElapsed(0); // If paused, current interval progress is 0
      return;
    }

    let animationFrameId: number;

    const updateTimer = () => {
      // Always get the fresh state inside the loop to avoid stale data
      const {
        mode: currentMode,
        pomodoroCycle: currentCycle,
        activeTask: currentTask,
      } = useTimerStore.getState();
      const elapsed = Date.now() - intervalStartTime;
      setCurrentIntervalElapsed(elapsed);

      // Check if the pomodoro interval is over
      if (currentMode === 'POMODORO' && elapsed >= currentIntervalDuration) {
        // Stop the animation frame to prevent multiple triggers
        cancelAnimationFrame(animationFrameId);

        // --- AUTOMATION LOGIC ---
        // 1. Get the current state *one time* to calculate the next state
        const currentState = useTimerStore.getState();
        const nextState = calculateNextPomodoroState(
          currentState,
          pomodoroSettings
        );

        // 2. Pause the timer and enter the transition state
        const finishedIntervalAccumulatedTime =
          currentState.accumulatedTime + currentIntervalDuration;
        setTimerState({
          isActive: false,
          accumulatedTime: finishedIntervalAccumulatedTime,
          intervalStartTime: null,
        });
        setTransitionTo(nextState.pomodoroCycle!);
        setIsTransitioning(true);

        // 3. Log the completed interval (this would be a server action call)
        if (currentCycle === 'WORK') {
          toast.success(`Work interval for "${currentTask?.title}" complete!`);
          console.log('LOGGING FINISHED WORK INTERVAL');
          // playSound('break'); // You can add sound logic here
        } else {
          // playSound('work');
        }
      } else {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isActive,
    intervalStartTime,
    currentIntervalDuration,
    setTimerState,
    pomodoroSettings,
  ]);

  const startNextInterval = () => {
    const currentState = useTimerStore.getState();
    const nextState = calculateNextPomodoroState(
      currentState,
      pomodoroSettings
    );
    setTimerState(nextState);
    setIsTransitioning(false);
    setTransitionTo(null);
  };

  const skipBreak = () => {
    // To skip a break, we calculate the next state and force the cycle to 'WORK'
    const currentState = useTimerStore.getState();
    const nextState = {
      ...calculateNextPomodoroState(currentState, pomodoroSettings),
      pomodoroCycle: 'WORK' as PomodoroCycle,
    };
    // We also need to reset the accumulated time for the new work interval
    nextState.accumulatedTime = 0;
    nextState.intervalStartTime = Date.now();

    setTimerState(nextState);
    setIsTransitioning(false);
    setTransitionTo(null);
  };

  return {
    displayTime,
    currentIntervalDuration,
    isTransitioning,
    transitionTo,
    startNextInterval,
    skipBreak,
  };
}
