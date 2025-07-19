import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { SessionVibe, TimerMode } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { NextResponse } from 'next/server';

export type GoalSummaryData = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  completedAt: Date;
  categoryName: string | null;
  totalFocusSeconds: number;
  totalTasksCompleted: number;
  totalSessions: number;
  dailyActivity: { date: string; seconds: number }[];
  vibeCounts: Record<SessionVibe, number>;

  modeCounts: Record<TimerMode, number>;
};

export async function GET(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    const { goalId } = params;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
      include: {
        tasks: { where: { status: 'COMPLETED' } },
        focusSessions: {
          where: { OR: [{ pomodoroCycle: 'WORK' }, { mode: 'STOPWATCH' }] },
          orderBy: { startTime: 'asc' },
        },
        category: true,
      },
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    const totalFocusSeconds = goal.focusSessions.reduce(
      (sum, s) => sum + s.durationSeconds,
      0
    );

    const vibeCounts = goal.focusSessions.reduce(
      (acc, s) => {
        if (s.vibe) {
          acc[s.vibe] = (acc[s.vibe] || 0) + 1;
        }
        return acc;
      },
      { FLOW: 0, NEUTRAL: 0, STRUGGLE: 0 }
    );

    const modeCounts = goal.focusSessions.reduce(
      (acc, s) => {
        acc[s.mode] = (acc[s.mode] || 0) + 1;
        return acc;
      },
      { POMODORO: 0, STOPWATCH: 0 }
    );

    const dailyActivityMap = new Map<string, number>();
    goal.focusSessions.forEach((s) => {
      const day = startOfDay(s.startTime).toISOString();
      dailyActivityMap.set(
        day,
        (dailyActivityMap.get(day) || 0) + s.durationSeconds
      );
    });
    const dailyActivity = Array.from(dailyActivityMap.entries())
      .map(([date, seconds]) => ({ date, seconds }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const summaryData: GoalSummaryData = {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      color: goal.color,
      completedAt: goal.updatedAt,
      categoryName: goal.category?.name || null,
      totalFocusSeconds,
      totalTasksCompleted: goal.tasks.length,
      totalSessions: goal.focusSessions.length,
      dailyActivity,
      vibeCounts,
      modeCounts,
    };

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('[API:GET_GOAL_SUMMARY]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
