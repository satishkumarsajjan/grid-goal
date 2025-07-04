'use client';

interface StatsCardsProps {
  streakData: { currentStreak: number; todayInStreak: boolean };
  totalFocusTodayInSeconds: number;
}

const formatSeconds = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function StatsCards({
  streakData,
  totalFocusTodayInSeconds,
}: StatsCardsProps) {
  const todayFocusFormatted = formatSeconds(totalFocusTodayInSeconds);

  return (
    <div className='grid gap-4 md:grid-cols-3 mb-8'>
      <div className='p-4 bg-card rounded-lg border'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          Current Streak
        </h3>
        <p className='text-2xl font-bold'>🔥 {streakData.currentStreak} Days</p>
      </div>
      <div className='p-4 bg-card rounded-lg border'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          Today's Focus
        </h3>
        <p className='text-2xl font-bold'>{todayFocusFormatted}</p>
      </div>
      <div className='p-4 bg-card rounded-lg border'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          Daily Goal
        </h3>
        <p className='text-2xl font-bold text-muted-foreground'>2h 30m</p>
      </div>
    </div>
  );
}
