import { auth } from '@/auth';
import { processSessionsForGrid } from '@/lib/grid-helpers';
import { calculateStreak, calculateTodayFocus } from '@/lib/streak-helpers';
import { prisma } from '@/prisma';

import { StatsCards } from '@/components/dashboard/stats-cards';
import { StartSessionButton } from '@/components/timer/start-session-button';

import { ActivityGrid } from '@/components/dashboard/activity-grid';
import { DailyFocusQueue } from '@/components/dashboard/daily-focus-queue'; // <-- IMPORT THE NEW COMPONENT

/**
 * This is the main async Server Component for the Dashboard.
 * It fetches all data needed for its child components and arranges them in the final layout.
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>Please sign in to view your dashboard.</p>;
  }
  const userId = session.user.id;

  // --- Data Fetching (remains the same) ---
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [sessions, pausePeriods] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId, startTime: { gte: oneYearAgo } },
      select: { startTime: true, durationSeconds: true },
      orderBy: { startTime: 'asc' },
    }),
    prisma.pausePeriod.findMany({ where: { userId } }),
  ]);

  // --- Data Processing (remains the same) ---
  const streakData = calculateStreak(sessions, pausePeriods);
  const totalFocusTodayInSeconds = calculateTodayFocus(sessions);
  const { totalHours, processedMonths } = processSessionsForGrid(sessions);

  return (
    <div>
      {/* --- Page Header --- */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='mt-1 text-lg text-muted-foreground'>
            Welcome back, {session.user.name || 'friend'}! Let's get focused.
          </p>
        </div>
        <StartSessionButton />
      </div>

      {/* --- NEW: Main Content Layout (Grid + Queue) --- */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Column (takes up 2/3 of the space on large screens) */}
        <div className='lg:col-span-2 space-y-8'>
          <StatsCards
            streakData={streakData}
            totalFocusTodayInSeconds={totalFocusTodayInSeconds}
          />
          <ActivityGrid
            totalHours={totalHours}
            processedMonths={processedMonths}
          />
        </div>

        {/* Right Column (takes up 1/3 of the space on large screens) */}
        <div className='lg:col-span-1'>
          {/* Here we place our new, self-contained component. */}
          {/* Because it uses TanStack Query, it will handle its own fetching,
              loading, and error states internally. */}
          <DailyFocusQueue />
        </div>
      </div>
    </div>
  );
}
