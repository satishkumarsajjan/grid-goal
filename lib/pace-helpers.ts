import { addDays, differenceInDays, startOfDay } from 'date-fns';

// Type for the data points our chart component will use.
interface PaceDataPoint {
  date: string;
  ideal: number | null; // Ideal remaining hours
  actual: number | null; // Actual remaining hours
}

// Type for the raw session data we expect.
type SessionData = { startTime: Date; durationSeconds: number };

/**
 * Calculates the data points for the Pace Indicator burndown chart.
 * @param goal - The goal object, must include deadline, createdAt, and estimatedTimeSeconds.
 * @param sessions - All focus sessions associated with the goal and its sub-goals.
 * @returns An array of data points for the chart.
 */
export function calculatePaceData(
  goal: {
    createdAt: Date;
    deadline: Date | null;
    estimatedTimeSeconds: number | null;
  },
  sessions: SessionData[]
): PaceDataPoint[] {
  // Ensure we have all necessary data to proceed.
  if (
    !goal.deadline ||
    !goal.estimatedTimeSeconds ||
    goal.estimatedTimeSeconds <= 0
  ) {
    return [];
  }

  const estimatedHours = goal.estimatedTimeSeconds / 3600;
  const startDate = startOfDay(new Date(goal.createdAt));
  const endDate = startOfDay(new Date(goal.deadline));

  const totalDays = differenceInDays(endDate, startDate);
  if (totalDays <= 0) return [];

  const idealBurnRatePerDay = estimatedHours / totalDays;
  let cumulativeBurnedHours = 0;

  // Create a map of actual hours burned per day for quick lookups.
  const actualBurnMap = new Map<string, number>();
  sessions.forEach((session) => {
    const dateStr = startOfDay(new Date(session.startTime))
      .toISOString()
      .split('T')[0];
    const hours = session.durationSeconds / 3600;
    actualBurnMap.set(dateStr, (actualBurnMap.get(dateStr) || 0) + hours);
  });

  const data: PaceDataPoint[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Only add to cumulative burn if the date is in the past or today.
    if (currentDate <= today) {
      cumulativeBurnedHours += actualBurnMap.get(dateStr) || 0;
    }

    data.push({
      date: dateStr,
      ideal: Math.max(0, estimatedHours - i * idealBurnRatePerDay),
      // Only show actual progress up to the current day.
      actual:
        currentDate <= today
          ? Math.max(0, estimatedHours - cumulativeBurnedHours)
          : null,
    });
  }
  return data;
}
