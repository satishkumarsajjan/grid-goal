import { calculateNextPomodoroState } from '@/lib/timer-machine';
import { useSettingsStore } from '@/store/settings-store';
import { useTimerStore } from '@/store/timer-store';
import type { PomodoroCycle } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const logCycle = async (payload: any) => {
  const { data } = await axios.post('/api/focus-sessions/log-cycle', payload);
  return data;
};

// NEW: A helper function to play sounds
const playSound = (soundFile: string, volume: number) => {
  try {
    const audio = new Audio(soundFile);
    audio.volume = volume;
    audio.play().catch((error) => {
      // Autoplay can be blocked by the browser, log error if it happens.
      console.error('Audio play failed:', error);
    });
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
};

export function useTimerEngine() {
  const { setTimerState, addTimeToTotal } = useTimerStore.getState();
  const pomodoroSettings = useSettingsStore((state) => state.pomodoro);
  // NEW: Get notification settings from the store
  const notificationSettings = useSettingsStore((state) => state.notifications);
  const queryClient = useQueryClient();

  const [currentIntervalElapsed, setCurrentIntervalElapsed] = useState(0);

  const {
    isActive,
    accumulatedTime,
    intervalStartTime,
    mode,
    pomodoroCycle,
    activeTask,
    sequenceId,
  } = useTimerStore();

  const displayTime = accumulatedTime + currentIntervalElapsed;

  const logCycleMutation = useMutation({
    mutationFn: logCycle,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['goal', variables.goalId],
      });
      console.log('Successfully logged cycle:', data);
    },
    onError: () => {
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
      const elapsed = Date.now() - intervalStartTime;
      setCurrentIntervalElapsed(elapsed);

      if (mode === 'POMODORO' && elapsed >= currentIntervalDuration) {
        cancelAnimationFrame(animationFrameId);

        // NEW: Play sound based on the completed cycle
        if (notificationSettings.soundEnabled) {
          if (pomodoroCycle === 'WORK') {
            playSound('/chime-work-end.mp3', notificationSettings.soundVolume);
          } else {
            // It was a break
            playSound('/chime-break-end.mp3', notificationSettings.soundVolume);
          }
        }

        if (pomodoroCycle === 'WORK') {
          addTimeToTotal(currentIntervalDuration);
        }

        const finishedCycleDuration = Math.round(
          currentIntervalDuration / 1000
        );

        if (activeTask && sequenceId) {
          logCycleMutation.mutate({
            startTime: new Date(
              Date.now() - currentIntervalDuration
            ).toISOString(),
            endTime: new Date().toISOString(),
            durationSeconds: finishedCycleDuration,
            taskId: activeTask.id,
            goalId: activeTask.goalId,
            mode: mode,
            pomodoroCycle: pomodoroCycle,
            sequenceId: sequenceId,
          });
        }

        const currentState = useTimerStore.getState();
        const nextState = calculateNextPomodoroState(
          currentState,
          pomodoroSettings
        );

        setTimerState({
          isActive: false,
          accumulatedTime: 0,
          intervalStartTime: null,
          isTransitioning: true,
          transitionTo: nextState.pomodoroCycle!,
        });
      } else {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };
    animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isActive,
    intervalStartTime,
    mode,
    pomodoroCycle,
    currentIntervalDuration,
    activeTask,
    sequenceId,
    pomodoroSettings,
    notificationSettings, // NEW: Add notificationSettings to dependency array
    setTimerState,
    addTimeToTotal,
    logCycleMutation,
  ]);

  const startNextInterval = () => {
    const currentState = useTimerStore.getState();
    const nextState = calculateNextPomodoroState(
      currentState,
      pomodoroSettings
    );
    setTimerState({
      ...nextState,
      accumulatedTime: 0,
      isTransitioning: false,
      transitionTo: null,
    });
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
    setTimerState({
      ...nextState,
      isTransitioning: false,
      transitionTo: null,
    });
  };

  return {
    displayTime,
    currentIntervalDuration,
    // Note: isTransitioning and transitionTo are no longer returned here
    // as they are consumed directly by the UI component from the store.
    // Let's re-add them for consistency with your FocusSessionUI component.
    isTransitioning: useTimerStore((s) => s.isTransitioning),
    transitionTo: useTimerStore((s) => s.transitionTo),
    startNextInterval,
    skipBreak,
  };
}
