// lib/grid-helpers.ts

import {
  startOfToday,
  startOfDay,
  eachDayOfInterval,
  getDay,
  format,
} from 'date-fns';

// --- TYPES ---
export type GridCellData = {
  date: string; // YYYY-MM-DD format
  level: 0 | 1 | 2 | 3 | 4;
  totalSeconds: number;
};

export type ProcessedGridData = {
  totalHours: number;
  gridData: GridCellData[];
  // We'll also return month boundaries to draw labels in the UI
  monthBoundaries: { name: string; columnStart: number }[];
};

// --- HELPERS ---

/**
 * Calculates activity level based on dynamic thresholds (quartiles).
 * This makes the color density relative to the user's own activity.
 */
const getActivityLevel = (
  totalSeconds: number,
  thresholds: { level1: number; level2: number; level3: number; level4: number }
): GridCellData['level'] => {
  if (totalSeconds <= 0) return 0;
  if (totalSeconds <= thresholds.level1) return 1;
  if (totalSeconds <= thresholds.level2) return 2;
  if (totalSeconds <= thresholds.level3) return 3;
  return 4;
};

// --- MAIN FUNCTION ---

export function processSessionsForGrid(
  sessions: { startTime: Date; durationSeconds: number }[]
): ProcessedGridData {
  // 1. Create an activity map using UTC dates to prevent timezone issues.
  const activityMap = new Map<string, number>(); // Maps 'YYYY-MM-DD' to totalSeconds
  let totalSecondsAcrossAllDays = 0;

  for (const session of sessions) {
    // Use startOfDay to normalize the date and remove time component safely.
    const dateKey = format(startOfDay(session.startTime), 'yyyy-MM-dd');
    const currentSeconds = activityMap.get(dateKey) ?? 0;
    const newTotal = currentSeconds + session.durationSeconds;
    activityMap.set(dateKey, newTotal);
  }

  // 2. Generate a complete 365-day date range, ending today.
  const today = startOfToday();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  oneYearAgo.setDate(today.getDate() + 1); // Start from 364 days ago

  const dateRange = eachDayOfInterval({ start: oneYearAgo, end: today });

  // 3. Calculate dynamic thresholds for color levels.
  const activityValues = Array.from(activityMap.values()).filter(
    (seconds) => seconds > 0
  );
  activityValues.sort((a, b) => a - b);

  const thresholds = {
    // Use quartiles for thresholds. If no activity, default to 1.
    level1: activityValues[Math.floor(activityValues.length * 0.25)] || 1,
    level2: activityValues[Math.floor(activityValues.length * 0.5)] || 1,
    level3: activityValues[Math.floor(activityValues.length * 0.75)] || 1,
    level4: Infinity, // The highest level is anything above level3
  };

  // 4. Create the final grid data structure.
  const gridData: GridCellData[] = dateRange.map((date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const totalSeconds = activityMap.get(dateKey) ?? 0;
    totalSecondsAcrossAllDays += totalSeconds;

    return {
      date: dateKey,
      totalSeconds,
      level: getActivityLevel(totalSeconds, thresholds),
    };
  });

  // 5. Add padding to the beginning to align the first day with the grid.
  // getUTCDay() returns 0 for Sunday, 1 for Monday, etc.
  const firstDayOfWeek = getDay(dateRange[0]);
  const padding: GridCellData[] = Array(firstDayOfWeek).fill({
    date: '',
    level: 0,
    totalSeconds: -1, // Use -1 to signify a padding cell
  });

  const finalGridData = [...padding, ...gridData];

  // 6. Calculate month boundaries for rendering labels.
  const monthBoundaries: { name: string; columnStart: number }[] = [];
  let lastMonth = -1;
  finalGridData.forEach((cell, index) => {
    if (cell.totalSeconds === -1) return; // Skip padding cells
    const date = new Date(cell.date);
    const month = date.getUTCMonth();
    if (month !== lastMonth) {
      monthBoundaries.push({
        name: format(date, 'MMM'),
        columnStart: Math.floor(index / 7) + 1, // CSS grid columns are 1-indexed
      });
      lastMonth = month;
    }
  });

  return {
    totalHours: Math.round(totalSecondsAcrossAllDays / 3600),
    gridData: finalGridData,
    monthBoundaries,
  };
}
