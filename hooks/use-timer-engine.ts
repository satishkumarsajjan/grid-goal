import { calculateNextPomodoroState } from '@/lib/timer-machine';
import { useSettingsStore } from '@/store/settings-store';
import { useTimerStore } from '@/store/timer-store';
import type { PomodoroCycle } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// NEW: Mutation function for background logging
const logCycle = async (payload: any) => {
  return axios.post('/api/focus-sessions/log-cycle', payload);
};

export function useTimerEngine() {
  const setTimerState = useTimerStore.setState;
  const pomodoroSettings = useSettingsStore((state) => state.pomodoro);
  const queryClient = useQueryClient();

  const [currentIntervalElapsed, setCurrentIntervalElapsed] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTo, setTransitionTo] = useState<PomodoroCycle | null>(null);

  const { isActive, accumulatedTime, intervalStartTime, mode, pomodoroCycle } =
    useTimerStore();
  const displayTime = accumulatedTime + currentIntervalElapsed;

  // NEW: The mutation hook for logging cycles
  const logCycleMutation = useMutation({
    mutationFn: logCycle,
    onSuccess: (_, variables) => {
      // Invalidate task data to reflect status change (PENDING -> IN_PROGRESS)
      queryClient.invalidateQueries({
        queryKey: ['taskListData', variables.goalId],
      });
    },
    onError: () => {
      // You could add more robust error handling here, like retries
      console.error('Failed to log pomodoro cycle to server.');
    },
  });

  const currentIntervalDuration = useMemo(() => {
    if (mode !== 'POMODORO') return Infinity;
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

  useEffect(() => {
    if (!isActive || !intervalStartTime) {
      setCurrentIntervalElapsed(0);
      return;
    }

    let animationFrameId: number;

    const updateTimer = () => {
      const currentState = useTimerStore.getState();
      const elapsed = Date.now() - intervalStartTime;
      setCurrentIntervalElapsed(elapsed);

      if (
        currentState.mode === 'POMODORO' &&
        elapsed >= currentIntervalDuration
      ) {
        cancelAnimationFrame(animationFrameId);

        // --- NEW AUTOMATION LOGIC ---
        const finishedCycleDuration = Math.round(
          currentIntervalDuration / 1000
        );

        // 1. Log the completed cycle in the background
        if (currentState.activeTask) {
          logCycleMutation.mutate({
            startTime: new Date(
              Date.now() - currentIntervalDuration
            ).toISOString(),
            endTime: new Date().toISOString(),
            durationSeconds: finishedCycleDuration,
            taskId: currentState.activeTask.id,
            goalId: currentState.activeTask.goalId,
            mode: currentState.mode,
            pomodoroCycle: currentState.pomodoroCycle,
          });
        }

        // 2. Calculate the next state for the timer
        const nextState = calculateNextPomodoroState(
          currentState,
          pomodoroSettings
        );

        // 3. Pause timer and show transition screen
        setTimerState({
          isActive: false,
          accumulatedTime: 0, // Reset accumulated time for each new cycle
          intervalStartTime: null,
        });
        setTransitionTo(nextState.pomodoroCycle!);
        setIsTransitioning(true);
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
    logCycleMutation,
  ]);

  const startNextInterval = () => {
    const currentState = useTimerStore.getState();
    const nextState = calculateNextPomodoroState(
      currentState,
      pomodoroSettings
    );
    setTimerState({ ...nextState, accumulatedTime: 0 }); // Ensure accumulated time is reset
    setIsTransitioning(false);
    setTransitionTo(null);
  };

  const skipBreak = () => {
    const currentState = useTimerStore.getState();
    const nextState = {
      ...calculateNextPomodoroState(currentState, pomodoroSettings),
      pomodoroCycle: 'WORK' as PomodoroCycle,
      accumulatedTime: 0,
      intervalStartTime: Date.now(),
      isActive: true,
    };
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
