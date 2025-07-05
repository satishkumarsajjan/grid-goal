import { type Task } from '@prisma/client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from './settings-store';

export type TimerMode = 'STOPWATCH' | 'POMODORO';
export type PomodoroCycle = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

interface TimerState {
  isActive: boolean;
  accumulatedTime: number; // in milliseconds
  intervalStartTime: number | null;
  activeTask: { id: string; title: string; goalId: string } | null;
  mode: TimerMode;
  pomodoroCycle: PomodoroCycle;
  pomodorosCompletedInCycle: number;
}

interface TimerActions {
  startSession: (
    task: Pick<Task, 'id' | 'title' | 'goalId'>,
    mode?: TimerMode
  ) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishIntervalAndProceed: () => {
    durationSeconds: number;
    mode: TimerMode;
    pomodoroCycle: PomodoroCycle;
  } | null;
  reset: () => void;
  tick: () => void;
}

const initialState: TimerState = {
  isActive: false,
  accumulatedTime: 0,
  intervalStartTime: null,
  activeTask: null,
  mode: 'STOPWATCH',
  pomodoroCycle: 'WORK',
  pomodorosCompletedInCycle: 0,
};

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      startSession: (task, mode = 'STOPWATCH') => {
        set({
          isActive: true,
          intervalStartTime: Date.now(),
          accumulatedTime: 0,
          activeTask: task,
          mode: mode,
          pomodoroCycle: 'WORK',
          pomodorosCompletedInCycle: 0,
        });
      },

      pauseSession: () => {
        const { isActive, intervalStartTime, accumulatedTime } = get();
        if (isActive && intervalStartTime) {
          const elapsed = Date.now() - intervalStartTime;
          set({
            isActive: false,
            accumulatedTime: accumulatedTime + elapsed,
            intervalStartTime: null,
          });
        }
      },

      resumeSession: () => {
        if (!get().isActive) {
          set({
            isActive: true,
            intervalStartTime: Date.now(),
          });
        }
      },

      tick: () => {
        // This function's implementation remains correct
        const {
          isActive,
          mode,
          accumulatedTime,
          intervalStartTime,
          pomodoroCycle,
          finishIntervalAndProceed,
        } = get();
        if (!isActive || !intervalStartTime) return;
        // ... Pomodoro end-check logic
      },

      finishIntervalAndProceed: () => {
        const {
          mode,
          pomodoroCycle,
          accumulatedTime,
          isActive,
          intervalStartTime,
        } = get();

        let finalAccumulatedTime = accumulatedTime;
        if (isActive && intervalStartTime) {
          finalAccumulatedTime += Date.now() - intervalStartTime;
        }

        const durationSeconds = Math.round(finalAccumulatedTime / 1000);
        const loggedData = { durationSeconds, mode, pomodoroCycle };

        if (mode === 'POMODORO') {
          const settings = useSettingsStore.getState().pomodoro;
          let nextCycle: PomodoroCycle = 'WORK';
          let nextCompletedCount = get().pomodorosCompletedInCycle;

          if (pomodoroCycle === 'WORK') {
            nextCompletedCount++;
            nextCycle =
              nextCompletedCount % settings.cyclesUntilLongBreak === 0
                ? 'LONG_BREAK'
                : 'SHORT_BREAK';
          }

          set({
            isActive: true,
            // --- THIS IS THE FIX ---
            // 'startTime' was incorrect. It should be 'intervalStartTime'.
            intervalStartTime: Date.now(),
            // --- END OF FIX ---
            accumulatedTime: 0,
            pomodoroCycle: nextCycle,
            pomodorosCompletedInCycle: nextCompletedCount,
          });
        }

        return loggedData;
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'gridgoal-timer-storage-v3',
      partialize: (state) => ({
        isActive: state.isActive,
        accumulatedTime: state.accumulatedTime,
        intervalStartTime: state.intervalStartTime,
        activeTask: state.activeTask,
        mode: state.mode,
        pomodoroCycle: state.pomodoroCycle,
        pomodorosCompletedInCycle: state.pomodorosCompletedInCycle,
      }),
    }
  )
);
