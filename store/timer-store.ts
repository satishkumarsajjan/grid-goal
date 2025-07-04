import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the possible modes and states for clarity
export type TimerMode = 'stopwatch' | 'pomodoro';
export type PomodoroState = 'work' | 'short_break' | 'long_break';

// Define the shape of our state
interface TimerState {
  // Existing State
  isActive: boolean;
  startTime: number | null;
  elapsedTime: number; // For stopwatch, this counts up. For pomodoro, it will count down.
  activeTaskId: string | null;
  activeGoalId: string | null;

  // --- NEW STATE FOR POMODORO ---
  mode: TimerMode;
  pomodoroState: PomodoroState;
  pomodorosCompleted: number; // Tracks how many work cycles are done

  // Actions
  startSession: (taskId: string, goalId: string, mode?: TimerMode) => void;
  stopSession: () => void;
  tick: () => void;
  // --- NEW ACTIONS FOR POMODORO ---
  nextPomodoroStep: () => void; // Moves from 'work' to 'break' and vice-versa
}

// --- POMODORO CONFIGURATION ---
// We can store durations in seconds for easy calculations
const POMODORO_DURATIONS = {
  work: 25 * 60, // 25 minutes
  short_break: 5 * 60, // 5 minutes
  long_break: 15 * 60, // 15 minutes
};
const POMODOROS_UNTIL_LONG_BREAK = 4;

export const useTimerStore = create<TimerState>()(
  // Use the 'persist' middleware to save the state to localStorage
  persist(
    (set, get) => ({
      // --- Initial State ---
      isActive: false,
      startTime: null,
      elapsedTime: 0,
      activeTaskId: null,
      activeGoalId: null,
      mode: 'stopwatch',
      pomodoroState: 'work',
      pomodorosCompleted: 0,

      // --- Actions ---
      startSession: (taskId, goalId, mode = 'stopwatch') => {
        const now = Date.now();
        set({
          isActive: true,
          startTime: now,
          activeTaskId: taskId,
          activeGoalId: goalId,
          mode: mode,
          // If starting a pomodoro, reset elapsedTime to the work duration
          elapsedTime: mode === 'pomodoro' ? POMODORO_DURATIONS.work : 0,
          // Reset pomodoro state if starting a new pomodoro session
          pomodoroState: mode === 'pomodoro' ? 'work' : get().pomodoroState,
          pomodorosCompleted:
            mode === 'pomodoro' ? 0 : get().pomodorosCompleted,
        });
      },

      stopSession: () => {
        set({
          isActive: false,
          startTime: null,
          elapsedTime: 0,
          activeTaskId: null,
          activeGoalId: null,
        });
      },

      tick: () => {
        if (!get().isActive) return;

        const { mode, elapsedTime } = get();
        if (mode === 'stopwatch') {
          // Stopwatch counts up
          set({ elapsedTime: Date.now() - (get().startTime ?? Date.now()) });
        } else {
          // Pomodoro mode
          // Pomodoro counts down
          const newElapsedTime = elapsedTime - 1;
          if (newElapsedTime <= 0) {
            // When timer hits zero, stop it and wait for user to start the next step
            set({ isActive: false, elapsedTime: 0 });
            // We could play a sound or show a notification here
          } else {
            set({ elapsedTime: newElapsedTime });
          }
        }
      },

      // --- NEW POMODORO ACTION ---
      nextPomodoroStep: () => {
        const { pomodoroState, pomodorosCompleted } = get();
        let nextState: PomodoroState = 'work';
        let nextPomodorosCompleted = pomodorosCompleted;

        if (pomodoroState === 'work') {
          // Finished a work session
          nextPomodorosCompleted++;
          if (nextPomodorosCompleted % POMODOROS_UNTIL_LONG_BREAK === 0) {
            nextState = 'long_break';
          } else {
            nextState = 'short_break';
          }
        } else {
          // Finished a break, go back to work
          nextState = 'work';
        }

        set({
          isActive: true, // Automatically start the next timer
          startTime: Date.now(),
          pomodoroState: nextState,
          pomodorosCompleted: nextPomodorosCompleted,
          elapsedTime: POMODORO_DURATIONS[nextState],
        });
      },
    }),
    {
      name: 'gridgoal-timer-storage', // Name for the localStorage item
    }
  )
);
