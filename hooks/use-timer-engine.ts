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

const playSound = (soundFile: string, volume: number) => {
  try {
    const audio = new Audio(soundFile);
    audio.volume = volume;
    audio.play().catch((error) => {
      console.error('Audio play failed:', error);
    });
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
};

export function useTimerEngine() {
  const { setTimerState, addTimeToTotal } = useTimerStore.getState();
  const pomodoroSettings = useSettingsStore((state) => state.pomodoro);
  const notificationSettings = useSettingsStore((state) => state.notifications);
  const queryClient = useQueryClient();

  // This state will hold the time to be displayed, updated every frame.
  const [displayTime, setDisplayTime] = useState(0);

  const {
    isActive,
    accumulatedTime,
    intervalStartTime,
    mode,
    pomodoroCycle,
    activeTask,
    sequenceId,
  } = useTimerStore();

  const logCycleMutation = useMutation({
    mutationFn: logCycle,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['goal', variables.goalId],
      });
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
    // When the timer is not active, ensure the display time reflects the final accumulated time.
    if (!isActive) {
      setDisplayTime(accumulatedTime);
      return;
    }

    // This should not happen, but it's a good guard clause.
    if (!intervalStartTime) {
      setDisplayTime(accumulatedTime);
      return;
    }

    let animationFrameId: number;

    const updateTimer = () => {
      const elapsedSinceResume = Date.now() - intervalStartTime;
      const newDisplayTime = accumulatedTime + elapsedSinceResume;

      setDisplayTime(newDisplayTime);

      if (mode === 'POMODORO' && newDisplayTime >= currentIntervalDuration) {
        cancelAnimationFrame(animationFrameId);

        if (notificationSettings.soundEnabled) {
          if (pomodoroCycle === 'WORK') {
            playSound('/chime-work-end.mp3', notificationSettings.soundVolume);
          } else {
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
    accumulatedTime, // Add `accumulatedTime` to the dependency array
    mode,
    pomodoroCycle,
    currentIntervalDuration,
    activeTask,
    sequenceId,
    pomodoroSettings,
    notificationSettings,
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
    isTransitioning: useTimerStore((s) => s.isTransitioning),
    transitionTo: useTimerStore((s) => s.transitionTo),
    startNextInterval,
    skipBreak,
  };
}
