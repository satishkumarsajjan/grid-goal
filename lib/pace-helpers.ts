import { addDays, differenceInDays, startOfDay } from 'date-fns';

// A more intuitive data structure for a "burn-up" chart
interface PaceDataPoint {
  date: string;
  targetPace: number; // The target cumulative hours completed by this date
  actualPace: number | null; // The actual cumulative hours completed by this date
}

type SessionData = { startTime: Date; durationSeconds: number };

/**
 * Calculates the data points for a CUMULATIVE PROGRESS (burn-up) chart.
 * @param goal - The goal object, must include deadline, createdAt, and estimatedTimeSeconds.
 * @param sessions - All focus sessions associated with the goal.
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

  // This is now the ideal "rate of completion" per day
  const idealRatePerDay = estimatedHours / totalDays;
  let cumulativeActualHours = 0;

  // This part remains the same: create a map for efficient lookups
  const actualHoursMap = new Map<string, number>();
  sessions.forEach((session) => {
    const dateStr = startOfDay(new Date(session.startTime))
      .toISOString()
      .split('T')[0];
    const hours = session.durationSeconds / 3600;
    actualHoursMap.set(dateStr, (actualHoursMap.get(dateStr) || 0) + hours);
  });

  const data: PaceDataPoint[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Update cumulative actual hours only for past/present dates
    if (currentDate <= today) {
      cumulativeActualHours += actualHoursMap.get(dateStr) || 0;
    }

    data.push({
      date: dateStr,
      // The target pace is a straight line climbing up from 0
      targetPace: i * idealRatePerDay,
      // The actual pace climbs up, but only shown up to today
      actualPace: currentDate <= today ? cumulativeActualHours : null,
    });
  }
  return data;
}
