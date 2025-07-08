import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { SessionVibe } from '@prisma/client';

export type FlowTriggerData = {
  categoryName: string;
  FLOW: number;
  NEUTRAL: number;
  STRUGGLE: number;
  totalSessions: number;
};

const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const MAX_CATEGORIES_TO_RETURN = 7;

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

    // Step 1: Find all sessions with a vibe in the date range
    const sessionsWithVibe = await prisma.focusSession.findMany({
      where: {
        userId,
        vibe: { not: null },
        goal: { categoryId: { not: null } },
        startTime: { gte: startDate, lte: endDate },
      },
      select: {
        vibe: true,
        goal: { select: { category: { select: { name: true } } } },
      },
    });

    // Step 2: Aggregate counts in memory
    const categoryStats: Record<
      string,
      Omit<FlowTriggerData, 'categoryName'>
    > = {};
    for (const session of sessionsWithVibe) {
      // This check is important because of the nested select
      if (session.goal?.category?.name && session.vibe) {
        const name = session.goal.category.name;
        if (!categoryStats[name]) {
          categoryStats[name] = {
            FLOW: 0,
            NEUTRAL: 0,
            STRUGGLE: 0,
            totalSessions: 0,
          };
        }
        categoryStats[name][session.vibe]++;
        categoryStats[name].totalSessions++;
      }
    }

    // Step 3: Convert to array, sort by total sessions, and take the top N
    const sortedCategories = Object.entries(categoryStats)
      .map(([categoryName, stats]) => ({ categoryName, ...stats }))
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, MAX_CATEGORIES_TO_RETURN);

    // Step 4 (Optional but good): Sort the final result by flow percentage for a nice default view
    sortedCategories.sort(
      (a, b) => b.FLOW / b.totalSessions - a.FLOW / a.totalSessions
    );

    return NextResponse.json(sortedCategories);
  } catch (error) {
    console.error('GET /api/analytics/flow-triggers Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
