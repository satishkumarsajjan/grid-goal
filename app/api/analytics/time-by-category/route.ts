import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Define the shape of the data returned by the API
export type TimeAllocationData = {
  // The top categories + potentially an "Other" category
  chartData: {
    categoryName: string;
    totalSeconds: number;
  }[];
  // The total time spent on goals without a category
  uncategorizedSeconds: number;
};

const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const MAX_CHART_SLICES = 4; // Show top 4 categories, the rest become "Other"

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
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }
    const { startDate, endDate } = validation.data;

    // --- Query 1: Get all categorized time, sorted by duration ---
    const categorizedTime = await prisma.focusSession.groupBy({
      by: ['goalId'],
      where: {
        userId,
        startTime: { gte: startDate, lte: endDate },
        goal: { categoryId: { not: null } },
      },
      _sum: { durationSeconds: true },
    });

    // We need to fetch the category names for the goals
    const goalIds = categorizedTime.map((item) => item.goalId);
    const goalsWithCategories = await prisma.goal.findMany({
      where: { id: { in: goalIds } },
      select: { id: true, category: { select: { name: true } } },
    });

    const categoryMap = goalsWithCategories.reduce((acc, goal) => {
      if (goal.category) acc[goal.id] = goal.category.name;
      return acc;
    }, {} as Record<string, string>);

    // Aggregate time by category name
    const aggregatedByCategory = categorizedTime.reduce((acc, item) => {
      const categoryName = categoryMap[item.goalId];
      if (categoryName) {
        acc[categoryName] =
          (acc[categoryName] || 0) + (item._sum.durationSeconds || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(aggregatedByCategory)
      .map(([name, seconds]) => ({ categoryName: name, totalSeconds: seconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    // --- Process into final chart data ("Other" slice logic) ---
    let chartData = sortedCategories;
    if (sortedCategories.length > MAX_CHART_SLICES) {
      const topSlices = sortedCategories.slice(0, MAX_CHART_SLICES);
      const otherSliceTotal = sortedCategories
        .slice(MAX_CHART_SLICES)
        .reduce((sum, item) => sum + item.totalSeconds, 0);

      chartData = [
        ...topSlices,
        { categoryName: 'Other', totalSeconds: otherSliceTotal },
      ];
    }

    // --- Query 2: Get total uncategorized time ---
    const uncategorizedTime = await prisma.focusSession.aggregate({
      _sum: { durationSeconds: true },
      where: {
        userId,
        startTime: { gte: startDate, lte: endDate },
        goal: { categoryId: null },
      },
    });

    const response: TimeAllocationData = {
      chartData,
      uncategorizedSeconds: uncategorizedTime._sum.durationSeconds || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/analytics/time-by-category Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
