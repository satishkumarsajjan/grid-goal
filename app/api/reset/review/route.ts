import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { subDays } from 'date-fns';
import { NextResponse } from 'next/server';

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

    const [completedGoals, completedTasks, sessions] = await Promise.all([
      prisma.goal.findMany({
        where: { userId, status: 'ARCHIVED', updatedAt: { gte: sevenDaysAgo } },
        select: { id: true, title: true },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.task.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          updatedAt: { gte: sevenDaysAgo },
        },
        include: { goal: { select: { title: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),

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
