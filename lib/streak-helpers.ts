import { differenceInCalendarDays, startOfToday } from 'date-fns';

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  todayInStreak: boolean;
}

export function calculateStreak(dates: Date[]): Streak {
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, todayInStreak: false };
  }

  // Create a set of unique dates (in YYYY-MM-DD format) to handle multiple sessions on the same day
  const uniqueDates = new Set(dates.map((d) => d.toISOString().split('T')[0]));
  const sortedDates = Array.from(uniqueDates)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, todayInStreak: false };
  }

  let currentStreak = 0;
  let longestStreak = 0;

  const today = startOfToday();
  const lastDate = sortedDates[sortedDates.length - 1];

  // Check if the streak is current
  const diffFromToday = differenceInCalendarDays(today, lastDate);
  const todayInStreak = diffFromToday === 0;
  const streakIsActive = diffFromToday <= 1;

  if (streakIsActive) {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const diff = differenceInCalendarDays(sortedDates[i + 1], sortedDates[i]);
      if (diff === 1) {
        currentStreak++;
      } else {
        break; // The streak is broken
      }
    }
  }

  // Calculate the longest streak ever
  if (sortedDates.length > 0) {
    let localLongest = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = differenceInCalendarDays(sortedDates[i], sortedDates[i - 1]);
      if (diff === 1) {
        localLongest++;
      } else {
        longestStreak = Math.max(longestStreak, localLongest);
        localLongest = 1; // Reset for the new potential streak
      }
    }
    longestStreak = Math.max(longestStreak, localLongest);
  }

  return {
    currentStreak: streakIsActive ? currentStreak : 0,
    longestStreak,
    todayInStreak,
  };
}
