import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export type TimeAllocationChartData = {
  chartData: {
    name: string;
    totalSeconds: number;
  }[];

  unallocatedSeconds: number;
};

const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),

  by: z.enum(['category', 'goal']),
});

const MAX_CHART_SLICES = 4;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      by: searchParams.get('by'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }
    const { startDate, endDate, by } = validation.data;

    let chartData: { name: string; totalSeconds: number }[] = [];
    let unallocatedSeconds = 0;

    if (by === 'category') {
      const categorizedTime = await prisma.focusSession.groupBy({
        by: ['goalId'],
        where: {
          userId,
          startTime: { gte: startDate, lte: endDate },
          goal: { categoryId: { not: null } },
        },
        _sum: { durationSeconds: true },
      });

      const goalIds = categorizedTime.map((item) => item.goalId);
      const goalsWithCategories = await prisma.goal.findMany({
        where: { id: { in: goalIds } },
        select: { id: true, category: { select: { name: true } } },
      });

      const categoryMap = goalsWithCategories.reduce((acc, goal) => {
        if (goal.category) acc[goal.id] = goal.category.name;
        return acc;
      }, {} as Record<string, string>);

      const aggregatedByCategory = categorizedTime.reduce((acc, item) => {
        const categoryName = categoryMap[item.goalId];
        if (categoryName) {
          acc[categoryName] =
            (acc[categoryName] || 0) + (item._sum.durationSeconds || 0);
        }
        return acc;
      }, {} as Record<string, number>);

      chartData = Object.entries(aggregatedByCategory)
        .map(([name, seconds]) => ({ name, totalSeconds: seconds }))
        .sort((a, b) => b.totalSeconds - a.totalSeconds);

      const uncategorizedTime = await prisma.focusSession.aggregate({
        _sum: { durationSeconds: true },
        where: {
          userId,
          startTime: { gte: startDate, lte: endDate },
          goal: { categoryId: null },
        },
      });
      unallocatedSeconds = uncategorizedTime._sum.durationSeconds || 0;
    } else if (by === 'goal') {
      const timeByGoal = await prisma.focusSession.groupBy({
        by: ['goalId'],
        where: {
          userId,
          startTime: { gte: startDate, lte: endDate },
        },
        _sum: { durationSeconds: true },
        orderBy: { _sum: { durationSeconds: 'desc' } },
      });

      const goalIds = timeByGoal.map((item) => item.goalId);
      const goals = await prisma.goal.findMany({
        where: { id: { in: goalIds } },
        select: { id: true, title: true },
      });

      const goalTitleMap = goals.reduce((acc, goal) => {
        acc[goal.id] = goal.title;
        return acc;
      }, {} as Record<string, string>);

      chartData = timeByGoal.map((item) => ({
        name: goalTitleMap[item.goalId] || 'Untitled Goal',
        totalSeconds: item._sum.durationSeconds || 0,
      }));

      unallocatedSeconds = 0;
    }

    let processedChartData = chartData;
    if (chartData.length > MAX_CHART_SLICES) {
      const topSlices = chartData.slice(0, MAX_CHART_SLICES);
      const otherSliceTotal = chartData
        .slice(MAX_CHART_SLICES)
        .reduce((sum, item) => sum + item.totalSeconds, 0);

      processedChartData = [
        ...topSlices,
        { name: 'Other', totalSeconds: otherSliceTotal },
      ];
    }

    const response: TimeAllocationChartData = {
      chartData: processedChartData,
      unallocatedSeconds,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/analytics/time-allocation Error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
