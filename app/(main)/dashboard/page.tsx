import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { processSessionsForGrid } from '@/lib/grid-helpers';
import { calculateStreak, calculateTodayFocus } from '@/lib/streak-helpers';

import { StartSessionButton } from '@/components/timer/start-session-button';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityGrid } from '@/components/dashboard/activity-grid';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>Please sign in to view your dashboard.</p>;
  }
  const userId = session.user.id;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const sessions = await prisma.focusSession.findMany({
    where: { userId, startTime: { gte: oneYearAgo } },
    select: { startTime: true, durationSeconds: true },
    orderBy: { startTime: 'asc' },
  });

  const pausePeriods = await prisma.pausePeriod.findMany({ where: { userId } });

  const streakData = calculateStreak(sessions, pausePeriods);
  const totalFocusTodayInSeconds = calculateTodayFocus(sessions);
  const { totalHours, processedMonths } = processSessionsForGrid(sessions);

  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50'>
            Dashboard
          </h1>
          <p className='mt-1 text-lg text-gray-600 dark:text-gray-400'>
            Welcome back, {session.user.name || 'friend'}! Let's get focused.
          </p>
        </div>
        <StartSessionButton />
      </div>

      <StatsCards
        streakData={streakData}
        totalFocusTodayInSeconds={totalFocusTodayInSeconds}
      />

      <ActivityGrid totalHours={totalHours} processedMonths={processedMonths} />
    </div>
  );
}
