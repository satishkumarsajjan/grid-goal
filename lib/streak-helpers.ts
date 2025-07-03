type Session = { startTime: Date };
type PausePeriod = { startDate: Date; endDate: Date };

export function calculateStreak(
  sessions: Session[],
  pausePeriods: PausePeriod[]
) {
  if (sessions.length === 0) {
    return { currentStreak: 0, todayInStreak: false };
  }

  const sessionDates = new Set(
    sessions.map((s) => s.startTime.toISOString().split('T')[0])
  );
  const pauseDateRanges = pausePeriods.map((p) => ({
    start: new Date(p.startDate.toISOString().split('T')[0]),
    end: new Date(p.endDate.toISOString().split('T')[0]),
  }));

  let currentStreak = 0;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayInStreak = sessionDates.has(todayStr);

  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const isPaused = pauseDateRanges.some(
      (range) => d >= range.start && d <= range.end
    );

    if (sessionDates.has(dateStr)) {
      currentStreak++;
    } else if (isPaused) {
      continue;
    } else {
      break;
    }
  }

  if (!todayInStreak && currentStreak > 0) {
    const d = new Date();
    const isPausedToday = pauseDateRanges.some(
      (range) => d >= range.start && d <= range.end
    );
    if (!isPausedToday) {
      // If today wasn't a session and wasn't a pause, but the loop counted it, decrement.
      // This happens when the streak ended yesterday.
      if (currentStreak > 0) currentStreak--;
    }
  }

  return { currentStreak, todayInStreak };
}

export function calculateTodayFocus(
  sessions: { startTime: Date; durationSeconds: number }[]
): number {
  const todayStr = new Date().toISOString().split('T')[0];
  return sessions
    .filter((s) => s.startTime.toISOString().startsWith(todayStr))
    .reduce((total, session) => total + session.durationSeconds, 0);
}
