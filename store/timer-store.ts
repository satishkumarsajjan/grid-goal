import type { PomodoroCycle, TimerMode } from '@prisma/client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActiveTask {
  id: string;
  title: string;
  goalId: string;
  goalTitle: string;
}

export interface TimerState {
  isActive: boolean;
  accumulatedTime: number; // in milliseconds
  intervalStartTime: number | null;
  activeTask: ActiveTask | null;
  mode: TimerMode;
  pomodoroCycle: PomodoroCycle;
  pomodorosCompletedInCycle: number;
  // NEW: A unique ID for the entire Pomodoro sequence (e.g., 4 work + 3 breaks).
  // This will be used to group session logs. It's null for stopwatch mode.
  sequenceId: string | null;
}

interface TimerActions {
  startSession: (task: ActiveTask, mode: TimerMode) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  reset: () => void;
  // We may need this later if we update state from the engine
  setTimerState: (newState: Partial<TimerState>) => void;
}

const initialState: TimerState = {
  isActive: false,
  accumulatedTime: 0,
  intervalStartTime: null,
  activeTask: null,
  mode: 'STOPWATCH',
  pomodoroCycle: 'WORK',
  pomodorosCompletedInCycle: 0,
  sequenceId: null, // Default to null
};

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTimerState: (newState) => set(newState),

      startSession: (task, mode) => {
        const isNewPomodoroSession = mode === 'POMODORO';
        set({
          isActive: true,
          intervalStartTime: Date.now(),
          accumulatedTime: 0,
          activeTask: task,
          mode: mode,
          // Reset Pomodoro state at the start of a new session
          pomodoroCycle: 'WORK',
          pomodorosCompletedInCycle: 0,
          // NEW: Generate a unique ID for this new Pomodoro sequence
          sequenceId: isNewPomodoroSession ? crypto.randomUUID() : null,
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
      name: 'gridgoal-timer-storage-v5', // Incremented version to avoid conflicts
      partialize: (state) => ({
        // ... include all state properties including the new sequenceId
        isActive: state.isActive,
        accumulatedTime: state.accumulatedTime,
        intervalStartTime: state.intervalStartTime,
        activeTask: state.activeTask,
        mode: state.mode,
        pomodoroCycle: state.pomodoroCycle,
        pomodorosCompletedInCycle: state.pomodorosCompletedInCycle,
        sequenceId: state.sequenceId, // Persist the sequence ID
      }),
    }
  )
);
