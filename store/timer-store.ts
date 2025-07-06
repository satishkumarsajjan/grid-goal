import type { PomodoroCycle, TimerMode } from '@prisma/client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the full shape of the task object we'll store
export interface ActiveTask {
  id: string;
  title: string;
  goalId: string;
  goalTitle: string;
}

// The shape of the state managed by this store
export interface TimerState {
  isActive: boolean;
  accumulatedTime: number; // in milliseconds
  intervalStartTime: number | null;
  activeTask: ActiveTask | null; // Use the new, more detailed type
  mode: TimerMode;
  pomodoroCycle: PomodoroCycle;
  pomodorosCompletedInCycle: number;
}

// The actions that can be dispatched to modify the state
interface TimerActions {
  // The signature of startSession now expects the full ActiveTask object
  startSession: (task: ActiveTask, mode: TimerMode) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  reset: () => void;
}

// The initial, default state for the store
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

      startSession: (task, mode) => {
        const isNewPomodoroSession = mode === 'POMODORO';
        set({
          isActive: true,
          intervalStartTime: Date.now(),
          accumulatedTime: 0,
          activeTask: task, // Store the full task object with goalTitle
          mode: mode,
          pomodoroCycle: isNewPomodoroSession ? 'WORK' : get().pomodoroCycle,
          pomodorosCompletedInCycle: isNewPomodoroSession
            ? 0
            : get().pomodorosCompletedInCycle,
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

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'gridgoal-timer-storage-v4',
      partialize: (state) => ({
        isActive: state.isActive,
        accumulatedTime: state.accumulatedTime,
        intervalStartTime: state.intervalStartTime,
        activeTask: state.activeTask, // This now includes goalTitle
        mode: state.mode,
        pomodoroCycle: state.pomodoroCycle,
        pomodorosCompletedInCycle: state.pomodorosCompletedInCycle,
      }),
    }
  )
);
