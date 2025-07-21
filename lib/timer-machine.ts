import type { TimerState } from '@/store/timer-store';
import type { PomodoroSettings } from '@/store/settings-store';
import type { PomodoroCycle } from '@prisma/client';

/**
 * Calculates the final, accurate duration of a session when it's manually finished.
 * This now reflects the TOTAL time across all intervals.
 * @param state - The current state from the timer store.
 * @returns The total duration in seconds.
 */
export function calculateFinalDuration(state: TimerState): number {
  // Start with the total time accumulated from previous, completed intervals.
  let finalTotalTime = state.totalAccumulatedTime;

  // Add the time from the current, active interval.
  let currentIntervalTime = state.accumulatedTime;
  if (state.isActive && state.intervalStartTime) {
    currentIntervalTime += Date.now() - state.intervalStartTime;
  }

  finalTotalTime += currentIntervalTime;

  return Math.round(finalTotalTime / 1000);
}

/**
 * Calculates the next state for a Pomodoro cycle after an interval completes.
 * @param state - The current state from the timer store.
 * @param settings - The user's current Pomodoro settings.
 * @returns A partial TimerState object representing the new state for the next interval.
 */
export function calculateNextPomodoroState(
  state: TimerState,
  settings: PomodoroSettings
): Partial<TimerState> {
  let nextCycle: PomodoroCycle = 'WORK';
  let nextCompletedCount = state.pomodorosCompletedInCycle;

  if (state.pomodoroCycle === 'WORK') {
    nextCompletedCount++;
    if (
      nextCompletedCount > 0 &&
      nextCompletedCount % settings.cyclesUntilLongBreak === 0
    ) {
      nextCycle = 'LONG_BREAK';
    } else {
      nextCycle = 'SHORT_BREAK';
    }
  }
  // If the last cycle was any kind of break, the next is always 'WORK'.

  return {
    isActive: true, // Automatically start the next interval
    intervalStartTime: Date.now(),
    accumulatedTime: 0, // Reset accumulator for the new interval
    pomodoroCycle: nextCycle,
    pomodorosCompletedInCycle: nextCompletedCount,
  };
}
