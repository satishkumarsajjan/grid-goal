import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { subDays } from 'date-fns';

export type ReviewData = {
  completedGoals: { id: string; title: string }[];
  completedTasks: { id: string; title: string; goal: { title: string } }[];
  timeByCategory: { name: string; totalSeconds: number }[];
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    const sevenDaysAgo = subDays(new Date(), 7);

    // Fetch all necessary data in parallel
    const [completedGoals, completedTasks, sessions] = await Promise.all([
      // 1. Goals completed in the last 7 days
      prisma.goal.findMany({
        where: { userId, status: 'ARCHIVED', updatedAt: { gte: sevenDaysAgo } },
        select: { id: true, title: true },
        orderBy: { updatedAt: 'desc' },
      }),
      // 2. Tasks completed in the last 7 days
      prisma.task.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          updatedAt: { gte: sevenDaysAgo },
        },
        include: { goal: { select: { title: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10, // Limit to 10 most recent tasks to avoid overload
      }),
      // 3. Sessions to calculate time by category
      prisma.focusSession.findMany({
        where: {
          userId,
          startTime: { gte: sevenDaysAgo },
          goal: { categoryId: { not: null } },
        },
        include: {
          goal: { select: { category: { select: { name: true } } } },
        },
      }),
    ]);

    // Process sessions to aggregate time by category
    const timeByCategoryMap: Record<string, number> = {};
    for (const sess of sessions) {
      if (sess.goal?.category?.name) {
        const categoryName = sess.goal.category.name;
        timeByCategoryMap[categoryName] =
          (timeByCategoryMap[categoryName] || 0) + sess.durationSeconds;
      }
    }
    const timeByCategory = Object.entries(timeByCategoryMap)
      .map(([name, totalSeconds]) => ({ name, totalSeconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    const response: ReviewData = {
      completedGoals,
      completedTasks,
      timeByCategory,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API:GET_REVIEW_DATA]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
