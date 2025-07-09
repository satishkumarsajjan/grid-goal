import { addDays, differenceInDays, startOfDay } from 'date-fns';

// A data structure for the "burn-up" chart points. This remains unchanged.
interface PaceDataPoint {
  date: string;
  targetPace: number; // The target cumulative hours completed by this date
  actualPace: number | null; // The actual cumulative hours completed by this date
}

// A simplified type for the session data needed by this function. This remains unchanged.
type SessionData = { startTime: Date; durationSeconds: number };

/**
 * Calculates the data points for a CUMULATIVE PROGRESS (burn-up) chart.
 * This function is now decoupled from the Goal model's structure and takes the
 * total estimate as a direct argument.
 *
 * @param goal - The goal object, must include deadline and createdAt.
 * @param sessions - All focus sessions associated with the goal.
 * @param totalEstimatedSeconds - The pre-calculated SUM of all task/sub-goal estimates for this goal tree.
 * @returns An array of PaceDataPoint objects ready for charting.
 */
export function calculatePaceData(
  // FIX: The `goal` type no longer includes estimatedTimeSeconds.
  goal: {
    createdAt: Date;
    deadline: Date | null;
  },
  sessions: SessionData[],
  // FIX: totalEstimatedSeconds is now a direct, required argument.
  totalEstimatedSeconds: number | null
): PaceDataPoint[] {
  // FIX: The guard clause now checks the new argument.
  if (!goal.deadline || !totalEstimatedSeconds || totalEstimatedSeconds <= 0) {
    return [];
  }

  // FIX: The calculation now uses the new argument.
  const estimatedHours = totalEstimatedSeconds / 3600;

  // The rest of the function's logic remains exactly the same, as it was already
  // correctly using the `estimatedHours` variable derived from the input.
  const startDate = startOfDay(new Date(goal.createdAt));
  const endDate = startOfDay(new Date(goal.deadline));

  const totalDays = differenceInDays(endDate, startDate);
  if (totalDays <= 0) return [];

  const idealRatePerDay = estimatedHours / totalDays;
  let cumulativeActualHours = 0;

  // Create a map of actual hours worked per day for efficient lookups.
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

  // Generate a data point for each day in the goal's timeline.
  for (let i = 0; i <= totalDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Only update the cumulative actual hours for past or present dates.
    if (currentDate <= today) {
      cumulativeActualHours += actualHoursMap.get(dateStr) || 0;
    }

    data.push({
      date: dateStr,
      // The target pace is a straight, idealized line of progress.
      targetPace: i * idealRatePerDay,
      // The actual pace is only shown up to today. Future points are null.
      actualPace: currentDate <= today ? cumulativeActualHours : null,
    });
  }

  return data;
}
