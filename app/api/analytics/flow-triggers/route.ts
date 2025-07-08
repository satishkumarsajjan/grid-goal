import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { SessionVibe } from '@prisma/client';

// The shape of our raw data from the DB query
type FlowTriggerRawData = {
  categoryName: string;
  vibe: SessionVibe;
  count: number;
};

// Zod schema for validating incoming query parameters
const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

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
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }
    const { startDate, endDate } = validation.data;

    // This raw SQL query is the most efficient way to get this data.
    // It joins sessions to goals to categories, filters for sessions with a vibe,
    // groups by category and vibe, and returns the count for each combination.
    const result = await prisma.$queryRaw<FlowTriggerRawData[]>`
      SELECT
        c.name as "categoryName",
        fs.vibe,
        COUNT(*)::int as count
      FROM "FocusSession" fs
      JOIN "Goal" g ON fs."goalId" = g.id
      JOIN "Category" c ON g."categoryId" = c.id
      WHERE
        fs."userId" = ${userId}
        AND fs.vibe IS NOT NULL
        AND g."categoryId" IS NOT NULL
        AND fs."startTime" >= ${startDate}
        AND fs."startTime" <= ${endDate}
      GROUP BY
        c.name, fs.vibe
      ORDER BY
        c.name, fs.vibe;
    `;

    // Convert BigInt to Number for JSON serialization, though `::int` cast helps.
    const serializedResult = result.map((item) => ({
      ...item,
      count: Number(item.count),
    }));

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error('GET /api/analytics/flow-triggers Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
