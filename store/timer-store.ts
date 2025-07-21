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
  accumulatedTime: number; // Time for the CURRENT interval
  intervalStartTime: number | null;
  activeTask: ActiveTask | null;
  mode: TimerMode;
  pomodoroCycle: PomodoroCycle;
  pomodorosCompletedInCycle: number;
  sequenceId: string | null;
  isTransitioning: boolean;
  transitionTo: PomodoroCycle | null;
  sessionStartTime: number | null;

  // NEW: Total time accumulated across ALL intervals in the session.
  // This will be used for the final summary.
  totalAccumulatedTime: number;
}

interface TimerActions {
  startSession: (task: ActiveTask, mode: TimerMode) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  reset: () => void;
  setTimerState: (newState: Partial<TimerState>) => void;
  // NEW: Action to add time to the total accumulator.
  addTimeToTotal: (ms: number) => void;
}

const initialState: TimerState = {
  isActive: false,
  accumulatedTime: 0,
  intervalStartTime: null,
  activeTask: null,
  mode: 'STOPWATCH',
  pomodoroCycle: 'WORK',
  pomodorosCompletedInCycle: 0,
  sequenceId: null,
  isTransitioning: false,
  transitionTo: null,
  sessionStartTime: null,

  // NEW: Initial state for total time
  totalAccumulatedTime: 0,
};

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTimerState: (newState) => set(newState),

      addTimeToTotal: (ms) => {
        set((state) => ({
          totalAccumulatedTime: state.totalAccumulatedTime + ms,
        }));
      },

      startSession: (task, mode) => {
        const isNewPomodoroSession = mode === 'POMODORO';
        const now = Date.now();
        set({
          isActive: true,
          intervalStartTime: now,
          accumulatedTime: 0,
          activeTask: task,
          mode: mode,
          pomodoroCycle: 'WORK',
          pomodorosCompletedInCycle: 0,
          sequenceId: isNewPomodoroSession ? crypto.randomUUID() : null,
          isTransitioning: false,
          transitionTo: null,
          sessionStartTime: now,
          // Reset total time at the start of a new session
          totalAccumulatedTime: 0,
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
      name: 'gridgoal-timer-storage-v5',
      partialize: (state) => ({
        isActive: state.isActive,
        accumulatedTime: state.accumulatedTime,
        intervalStartTime: state.intervalStartTime,
        activeTask: state.activeTask,
        mode: state.mode,
        pomodoroCycle: state.pomodoroCycle,
        pomodorosCompletedInCycle: state.pomodorosCompletedInCycle,
        sequenceId: state.sequenceId,
        isTransitioning: state.isTransitioning,
        transitionTo: state.transitionTo,
        sessionStartTime: state.sessionStartTime,
        totalAccumulatedTime: state.totalAccumulatedTime,
      }),
    }
  )
);
