import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { processSessionsForGrid } from '@/lib/grid-helpers';
import { calculateStreak, calculateTodayFocus } from '@/lib/streak-helpers';
import { isBefore, addDays, startOfToday, add } from 'date-fns';

import { StartSessionButton } from '@/components/timer/start-session-button';
import { WeeklyResetPrompt } from '@/components/reset/weekly-reset-prompt';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { DailyFocusQueue } from '@/components/dashboard/daily-focus-queue';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { ActiveGoals } from '@/components/dashboard/ActiveGoals';
import { ActivityGrid } from '@/components/dashboard/activity-grid';
import { Achievements } from '@/components/dashboard/Achievements';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>Please sign in to view your dashboard.</p>;
  }
  const userId = session.user.id;

  // --- Data Fetching (remains the same) ---
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const twoWeeksFromNow = add(new Date(), { weeks: 2 });

  const [
    user,
    sessions,
    pausePeriods,
    activeGoals,
    goalsWithUpcomingDeadlines,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.focusSession.findMany({
      where: { userId, startTime: { gte: oneYearAgo } },
      select: { startTime: true, durationSeconds: true },
      orderBy: { startTime: 'asc' },
    }),
    prisma.pausePeriod.findMany({ where: { userId } }),
    prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        tasks: { select: { status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        deadline: { gte: startOfToday(), lte: twoWeeksFromNow },
      },
      include: {
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { deadline: 'asc' },
    }),
  ]);

  if (!user) {
    return <p>Could not find user data.</p>;
  }

  // --- Data Processing (remains the same) ---
  const streakData = calculateStreak(sessions, pausePeriods);
  const totalFocusTodayInSeconds = calculateTodayFocus(sessions);
  const gridProps = processSessionsForGrid(sessions);
  const lastReset = user.lastResetAt;
  const shouldShowResetPrompt =
    !lastReset || isBefore(lastReset, addDays(new Date(), -6));

  const processedActiveGoals = activeGoals.map((goal) => {
    const totalTasks = goal.tasks.length;
    const completedTasks = goal.tasks.filter(
      (task) => task.status === 'COMPLETED'
    ).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { id: goal.id, title: goal.title, color: goal.color, progress };
  });

  const upcomingTasks = goalsWithUpcomingDeadlines
    .flatMap((goal) =>
      goal.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        goalTitle: goal.title,
        deadline: goal.deadline,
      }))
    )
    .slice(0, 5);

  return (
    <div className='space-y-8'>
      {/* Header Section */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='mt-1 text-lg text-muted-foreground'>
            Welcome back, {session.user.name || 'friend'}!
          </p>
        </div>
        <StartSessionButton />
      </div>

      <WeeklyResetPrompt shouldShow={shouldShowResetPrompt} />

      {/* --- NEW, ROBUST LAYOUT GRID --- */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-8'>
        {/* Main Content Column (fixed height items) */}
        <div className='lg:col-span-2 space-y-8'>
          <StatsCards
            streakData={streakData}
            totalFocusTodayInSeconds={totalFocusTodayInSeconds}
          />
          <ActiveGoals goals={processedActiveGoals} />
          <ActivityGrid {...gridProps} />
          <Achievements />
        </div>

        {/* Sidebar Column (vertically growing items) */}
        <div className='lg:col-span-1 space-y-8'>
          <UpcomingDeadlines tasks={upcomingTasks} />
          <DailyFocusQueue />
        </div>
      </div>
    </div>
  );
}
