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

  // 1. Create a set of unique dates (YYYY-MM-DD) where the user was active.
  // Using startOfDay ensures we ignore the time part of the date.
  const activeDays = new Set(
    sessions.map((s) => startOfDay(s.startTime).toISOString())
  );

  // 2. Define today and check if the user was active today.
  const today = startOfDay(new Date());
  let todayInStreak = activeDays.has(today.toISOString());

  let currentStreak = 0;
  let currentDate = today;

  // 3. Loop backwards from today for up to 365 days.
  for (let i = 0; i < 365; i++) {
    const dateToCheck = currentDate;
    const dateToCheckISO = dateToCheck.toISOString();

    // Check if the current date falls within any scheduled pause period.
    const isPaused = pausePeriods.some((period) =>
      isWithinInterval(dateToCheck, {
        start: startOfDay(period.startDate),
        end: startOfDay(period.endDate),
      })
    );

    const isActive = activeDays.has(dateToCheckISO);

    if (isActive) {
      // If the user was active, increment the streak.
      currentStreak++;
    } else if (isPaused) {
      // If the day was a scheduled break, we don't increment,
      // but we also don't break the loop. The streak is preserved.
      // However, if today is a pause day, it shouldn't count as part of an active streak.
      if (i === 0) {
        // If today is the first day we are checking
        todayInStreak = false;
      }
      continue;
    } else {
      // If the day was not active and not paused, the streak is broken. Stop counting.
      // We must correct if the loop breaks on the first day (today).
      if (i === 0) {
        todayInStreak = false;
      }
      break;
    }

    // Move to the previous day for the next iteration.
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
