import {
  isWithinInterval,
  startOfDay,
  differenceInCalendarDays,
} from 'date-fns';

// Define the types for clarity and type safety
export type Session = { startTime: Date };
export type PausePeriod = { startDate: Date; endDate: Date };
// --- FIX: Add longestStreak to the return type ---
export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  todayInStreak: boolean;
};

/**
 * Calculates the user's current and longest activity streaks, intelligently handling
 * scheduled pause periods (vacations).
 * @param sessions - An array of the user's focus sessions, sorted by startTime ascending.
 * @param pausePeriods - An array of the user's scheduled pause periods.
 * @returns An object containing the current streak, longest streak, and whether today is part of the streak.
 */
export function calculateStreak(
  sessions: Session[],
  pausePeriods: PausePeriod[]
): StreakData {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, todayInStreak: false };
  }

  // --- NEW, MORE EFFICIENT LOGIC ---
  // 1. Get a sorted, unique list of active days.
  const uniqueActiveDays = [
    ...new Set(sessions.map((s) => startOfDay(s.startTime).getTime())),
  ].sort((a, b) => a - b);

  // Convert pause periods to a quick-lookup structure
  const pauseIntervals = pausePeriods.map((p) => ({
    start: startOfDay(p.startDate),
    end: startOfDay(p.endDate),
  }));

  let currentStreak = 0;
  let longestStreak = 0;
  let todayInStreak = false;

  // 2. Iterate through the unique active days to find streaks.
  for (let i = 0; i < uniqueActiveDays.length; i++) {
    // Start of a new potential streak
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prevDay = new Date(uniqueActiveDays[i - 1]);
      const currentDay = new Date(uniqueActiveDays[i]);

      const daysBetween = differenceInCalendarDays(currentDay, prevDay);

      // Check if all days in the gap are covered by a pause period
      let gapIsPaused = true;
      if (daysBetween > 1) {
        for (let j = 1; j < daysBetween; j++) {
          const dayInGap = new Date(prevDay);
          dayInGap.setDate(dayInGap.getDate() + j);
          if (!pauseIntervals.some((p) => isWithinInterval(dayInGap, p))) {
            gapIsPaused = false;
            break;
          }
        }
      }

      if (daysBetween === 1 || (daysBetween > 1 && gapIsPaused)) {
        // The streak continues
        currentStreak++;
      } else {
        // The streak is broken, check if it was the longest
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        // Start a new streak
        currentStreak = 1;
      }
    }
  }

  // 3. After the loop, check the final `currentStreak` against the `longestStreak`.
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 4. Finally, determine the "current" streak status relative to today.
  const lastActiveDay = new Date(uniqueActiveDays[uniqueActiveDays.length - 1]);
  const today = startOfDay(new Date());
  const daysSinceLastActive = differenceInCalendarDays(today, lastActiveDay);

  if (daysSinceLastActive === 0) {
    // The last active day was today.
    todayInStreak = true;
  } else {
    // Check if the gap between today and the last active day is covered by a pause.
    let gapIsPaused = true;
    for (let j = 1; j < daysSinceLastActive; j++) {
      const dayInGap = new Date(lastActiveDay);
      dayInGap.setDate(dayInGap.getDate() + j);
      if (!pauseIntervals.some((p) => isWithinInterval(dayInGap, p))) {
        gapIsPaused = false;
        break;
      }
    }

    // If the gap is not paused, the current streak is 0.
    if (daysSinceLastActive > 1 && !gapIsPaused) {
      currentStreak = 0;
    }
    todayInStreak = false;
  }

  return { currentStreak, longestStreak, todayInStreak };
}

/**
 * Calculates the total focus time for the current day.
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
