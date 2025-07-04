import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { calculateStreak } from '@/lib/streak-helpers'; // We will create this helper

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    // 1. Fetch all sessions for the user
    // We only need the startTime for these calculations.
    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      select: { startTime: true, durationSeconds: true },
      orderBy: { startTime: 'asc' },
    });

    // 2. Aggregate session data into a map for the grid
    const activityByDate: Record<string, number> = {};
    let totalFocusToday = 0;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    sessions.forEach((s) => {
      const date = s.startTime.toISOString().split('T')[0];
      if (!activityByDate[date]) {
        activityByDate[date] = 0;
      }
      activityByDate[date] += s.durationSeconds;
      if (date === today) {
        totalFocusToday += s.durationSeconds;
      }
    });

    // 3. Calculate the streak using our server-side helper
    const streakData = calculateStreak(sessions.map((s) => s.startTime));

    // 4. Combine all data into a single response payload
    const dashboardData = {
      streak: streakData,
      totalFocusToday,
      activityByDate,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('[API:DASHBOARD_STATS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
