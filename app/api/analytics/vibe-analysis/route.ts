import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { SessionVibe } from '@prisma/client';

// Generic data shape for the response
export type VibeAnalysisData = {
  name: string; // Will be categoryName or goalTitle
  FLOW: number;
  NEUTRAL: number;
  STRUGGLE: number;
  totalSessions: number;
};

const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  // The entity to group the vibe data by
  by: z.enum(['category', 'goal']),
});

const MAX_ITEMS_TO_RETURN = 7;

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

    let finalData: VibeAnalysisData[] = [];

    // --- LOGIC TO GET DATA BY CATEGORY ---
    if (by === 'category') {
      const sessionsWithVibe = await prisma.focusSession.findMany({
        where: {
          userId,
          vibe: { not: null },
          goal: { categoryId: { not: null } }, // Only sessions with categorized goals
          startTime: { gte: startDate, lte: endDate },
        },
        select: {
          vibe: true,
          goal: { select: { category: { select: { name: true } } } },
        },
      });

      const categoryStats: Record<string, Omit<VibeAnalysisData, 'name'>> = {};
      for (const session of sessionsWithVibe) {
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

      finalData = Object.entries(categoryStats).map(([name, stats]) => ({
        name,
        ...stats,
      }));
    }
    // --- LOGIC TO GET DATA BY GOAL ---
    else if (by === 'goal') {
      const sessionsWithVibe = await prisma.focusSession.findMany({
        where: {
          userId,
          vibe: { not: null },
          startTime: { gte: startDate, lte: endDate },
        },
        select: {
          vibe: true,
          goal: { select: { id: true, title: true } },
        },
      });

      const goalStats: Record<string, Omit<VibeAnalysisData, 'name'>> = {};
      for (const session of sessionsWithVibe) {
        if (session.goal?.title && session.vibe) {
          const name = session.goal.title;
          if (!goalStats[name]) {
            goalStats[name] = {
              FLOW: 0,
              NEUTRAL: 0,
              STRUGGLE: 0,
              totalSessions: 0,
            };
          }
          goalStats[name][session.vibe]++;
          goalStats[name].totalSessions++;
        }
      }
      finalData = Object.entries(goalStats).map(([name, stats]) => ({
        name,
        ...stats,
      }));
    }

    // Sort by total sessions to get the most active items, then slice.
    const sortedData = finalData
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, MAX_ITEMS_TO_RETURN);

    // Finally, sort by flow percentage for a nice default view
    sortedData.sort(
      (a, b) => b.FLOW / b.totalSessions - a.FLOW / a.totalSessions
    );

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('GET /api/analytics/vibe-analysis Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
