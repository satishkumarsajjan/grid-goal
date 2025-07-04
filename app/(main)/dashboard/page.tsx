import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { processSessionsForGrid } from '@/lib/grid-helpers';
import { calculateStreak, calculateTodayFocus } from '@/lib/streak-helpers';
import { isBefore, addDays } from 'date-fns';

import { StartSessionButton } from '@/components/timer/start-session-button';
import { StatsCards } from '@/components/dashboard/stats-cards';

import { DailyFocusQueue } from '@/components/dashboard/daily-focus-queue';
import { WeeklyResetPrompt } from '@/components/reset/weekly-reset-prompt'; // <-- IMPORT PROMPT COMPONENT
import { ActivityGrid } from '@/components/dashboard/activity-grid';

/**
 * This is the main async Server Component for the Dashboard.
 * It fetches all data needed for its child components and arranges them in the final layout,
 * including the logic for when to show the Weekly Reset prompt.
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>Please sign in to view your dashboard.</p>;
  }
  const userId = session.user.id;

  // --- Data Fetching ---
  // We now need the full user object to get the 'lastResetAt' field.
  // We can fetch everything in parallel for maximum performance.
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [user, sessions, pausePeriods] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.focusSession.findMany({
      where: { userId, startTime: { gte: oneYearAgo } },
      select: { startTime: true, durationSeconds: true },
      orderBy: { startTime: 'asc' },
    }),
    prisma.pausePeriod.findMany({ where: { userId } }),
  ]);

  if (!user) {
    // This case should ideally never happen if a user has a valid session.
    return <p>Could not find user data.</p>;
  }

  // --- Data Processing ---
  const streakData = calculateStreak(sessions, pausePeriods);
  const totalFocusTodayInSeconds = calculateTodayFocus(sessions);
  const { totalHours, processedMonths } = processSessionsForGrid(sessions);

  // --- NEW: Logic to decide if the Weekly Reset prompt should be shown ---
  const lastReset = user.lastResetAt;
  // Show prompt if user has never reset OR their last reset was more than 6 days ago.
  const shouldShowResetPrompt =
    !lastReset || isBefore(lastReset, addDays(new Date(), -6));

  return (
    <div className='space-y-8'>
      {/* --- Page Header --- */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='mt-1 text-lg text-muted-foreground'>
            Welcome back, {session.user.name || 'friend'}! Let's get focused.
          </p>
        </div>
        <StartSessionButton />
      </div>

      {/* --- NEW: Weekly Reset Prompt --- */}
      {/* This component is rendered conditionally based on our server-side logic */}
      <WeeklyResetPrompt shouldShow={shouldShowResetPrompt} />

      {/* --- Main Content Layout (Grid + Queue) --- */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Column */}
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

        {/* Right Column */}
        <div className='lg:col-span-1'>
          <DailyFocusQueue />
        </div>
      </div>
    </div>
  );
}
