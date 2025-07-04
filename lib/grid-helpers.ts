type GridCellData = {
  date: string;
  totalSeconds: number;
  level: 0 | 1 | 2 | 3 | 4;
};
type MonthData = {
  year: number;
  month: number;
  monthName: string;
  days: (GridCellData | null)[];
};

const getActivityLevel = (hours: number): 0 | 1 | 2 | 3 | 4 => {
  if (hours <= 0) return 0;
  if (hours <= 2) return 1;
  if (hours <= 5) return 2;
  if (hours <= 8) return 3;
  return 4;
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function processSessionsForGrid(
  sessions: { startTime: Date; durationSeconds: number }[]
) {
  const activityMap = new Map<string, number>(); // Maps date string to totalSeconds
  for (const session of sessions) {
    const dateString = session.startTime.toISOString().split('T')[0];
    const currentSeconds = activityMap.get(dateString) ?? 0;
    activityMap.set(dateString, currentSeconds + session.durationSeconds);
  }

  const totalSecondsAcrossAllDays = Array.from(activityMap.values()).reduce(
    (sum, s) => sum + s,
    0
  );

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 364);

  const monthsMap = new Map<string, GridCellData[]>();

  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    if (d > today) continue;

    const dateString = d.toISOString().split('T')[0];
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;

    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, []);
    }

    const totalSeconds = activityMap.get(dateString) ?? 0;
    const hours = totalSeconds / 3600;

    monthsMap.get(monthKey)!.push({
      date: dateString,
      totalSeconds: totalSeconds,
      level: getActivityLevel(hours),
    });
  }

  const processedMonths: MonthData[] = [];
  for (const [key, daysInMonth] of monthsMap.entries()) {
    const [year, month] = key.split('-').map(Number);
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const paddedDays = [...Array(firstDayOfWeek).fill(null), ...daysInMonth];

    processedMonths.push({
      year,
      month,
      monthName: MONTH_NAMES[month],
      days: paddedDays,
    });
  }

  processedMonths.sort(
    (a, b) =>
      new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime()
  );

  return {
    totalHours: Math.round(totalSecondsAcrossAllDays / 3600),
    processedMonths: processedMonths.slice(-12),
  };
}
