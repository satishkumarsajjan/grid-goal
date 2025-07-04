import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of the state and the actions
interface TimerState {
  // STATE
  isActive: boolean;
  startTime: number | null; // Unix timestamp
  activeTaskId: string | null;
  activeGoalId: string | null;

  // ACTIONS
  startSession: (taskId: string, goalId: string) => void;
  stopSession: () => void;
  _hydrate: () => void; // Action to handle rehydration
}

// Create the store
export const useTimerStore = create<TimerState>()(
  // Use the 'persist' middleware to save the state to localStorage
  persist(
    (set) => ({
      // Initial state
      isActive: false,
      startTime: null,
      activeTaskId: null,
      activeGoalId: null,

      // Action to start a new session
      startSession: (taskId, goalId) =>
        set({
          isActive: true,
          startTime: Date.now(), // Record the current time
          activeTaskId: taskId,
          activeGoalId: goalId,
        }),

      // Action to stop and clear the session
      stopSession: () =>
        set({
          isActive: false,
          startTime: null,
          activeTaskId: null,
          activeGoalId: null,
        }),

      // This action is used to confirm that the store has rehydrated from localStorage
      _hydrate: () => {
        console.log('Timer store has been rehydrated from localStorage.');
      },
    }),
    {
      name: 'gridgoal-timer-storage', // Unique name for the localStorage item
      onRehydrateStorage: () => (state) => {
        // This is called when the store is rehydrated
        state?._hydrate();
      },
    }
  )
);

// Call this on initial load to handle cases where the browser was closed
// during an active session.
useTimerStore.getState()._hydrate();
