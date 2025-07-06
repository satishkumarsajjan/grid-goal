import { isWithinInterval, startOfDay } from 'date-fns';

// Define the types for clarity and type safety
type Session = { startTime: Date };
type PausePeriod = { startDate: Date; endDate: Date };
type StreakData = { currentStreak: number; todayInStreak: boolean };

/**
 * Calculates the user's current activity streak, intelligently handling
 * scheduled pause periods (vacations).
 * @param sessions - A sorted array of the user's focus sessions.
 * @param pausePeriods - An array of the user's scheduled pause periods.
 * @returns An object containing the current streak count and whether today is part of it.
 */
export function calculateStreak(
  sessions: Session[],
  pausePeriods: PausePeriod[]
): StreakData {
  if (sessions.length === 0) {
    return { currentStreak: 0, todayInStreak: false };
  }

  // Create a set of unique active days (YYYY-MM-DD)
  const activeDays = new Set(
    sessions.map((s) => startOfDay(s.startTime).toISOString())
  );

  const today = startOfDay(new Date());
  let currentDate = today;
  let todayInStreak = false;
  let currentStreak = 0;
  let foundFirstActive = false;

  // Find the most recent active day (could be today or before)
  for (let i = 0; i < 365; i++) {
    const dateToCheckISO = currentDate.toISOString();

    // Check if the current date falls within any scheduled pause period.
    const isPaused = pausePeriods.some((period) =>
      isWithinInterval(currentDate, {
        start: startOfDay(period.startDate),
        end: startOfDay(period.endDate),
      })
    );

    const isActive = activeDays.has(dateToCheckISO);

    if (isActive) {
      foundFirstActive = true;
      // If the first active day is today, set todayInStreak = true
      if (i === 0) todayInStreak = true;
      currentStreak++;
    } else if (isPaused) {
      // Paused days do not break the streak, just skip
    } else {
      // If not active and not paused, streak is broken
      if (!foundFirstActive) {
        // If we haven't found any active day yet, keep searching
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }
      break;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return { currentStreak, todayInStreak };
}

/**
 * Calculates the total focus time for the current day. This function remains unchanged.
 * @param sessions - An array of focus sessions.
 * @returns Total focus time for today in seconds.
 */
export function calculateTodayFocus(
  sessions: { startTime: Date; durationSeconds: number }[]
): number {
  const todayStart = startOfDay(new Date());
  return sessions
    .filter((s) => startOfDay(s.startTime).getTime() === todayStart.getTime())
    .reduce((total, session) => total + session.durationSeconds, 0);
}
