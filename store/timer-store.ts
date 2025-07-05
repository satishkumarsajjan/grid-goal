import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Task } from '@prisma/client';
import { useSettingsStore } from './settings-store'; // <-- Import the new settings store

export type TimerMode = 'STOPWATCH' | 'POMODORO';
export type PomodoroCycle = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

interface TimerState {
  isActive: boolean;
  startTime: number | null;
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
  // This is the key action that drives the automated flow
  finishIntervalAndProceed: () => {
    durationSeconds: number;
    mode: TimerMode;
    pomodoroCycle: PomodoroCycle;
  } | null;
  reset: () => void;
}

const initialState: TimerState = {
  isActive: false,
  startTime: null,
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
          startTime: Date.now(),
          activeTask: task,
          mode: mode,
          pomodoroCycle: 'WORK',
          pomodorosCompletedInCycle: 0,
        });
      },

      pauseSession: () => set({ isActive: false }),
      resumeSession: () => set({ isActive: true }),

      // This action now handles both finishing an interval AND starting the next one.
      finishIntervalAndProceed: () => {
        const { startTime, mode, pomodoroCycle, pomodorosCompletedInCycle } =
          get();
        if (!startTime) return null;

        // --- Part 1: Log the completed interval ---
        const endTime = Date.now();
        const durationSeconds = Math.round((endTime - startTime) / 1000);
        const loggedData = { durationSeconds, mode, pomodoroCycle };

        // --- Part 2: Calculate and start the NEXT interval ---
        // Get the latest settings from the settings store
        const settings = useSettingsStore.getState().pomodoro;

        let nextCycle: PomodoroCycle = 'WORK';
        let nextCompletedCount = pomodorosCompletedInCycle;

        if (pomodoroCycle === 'WORK') {
          nextCompletedCount++;
          if (nextCompletedCount % settings.cyclesUntilLongBreak === 0) {
            nextCycle = 'LONG_BREAK';
          } else {
            nextCycle = 'SHORT_BREAK';
          }
        } else {
          // If we just finished a break
          nextCycle = 'WORK';
        }

        set({
          isActive: true, // Automatically start the next interval
          startTime: Date.now(),
          pomodoroCycle: nextCycle,
          pomodorosCompletedInCycle: nextCompletedCount,
        });

        // Return the data for the interval that just finished, so it can be logged.
        return loggedData;
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'gridgoal-timer-storage-v2',
      partialize: (state) => ({
        isActive: state.isActive,
        startTime: state.startTime,
        activeTask: state.activeTask,
        mode: state.mode,
        pomodoroCycle: state.pomodoroCycle,
        pomodorosCompletedInCycle: state.pomodorosCompletedInCycle,
      }),
    }
  )
);
