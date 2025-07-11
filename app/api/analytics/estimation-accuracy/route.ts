import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

export type EstimationAccuracyItem = {
  goalId: string;
  goalTitle: string;
  totalEstimatedSeconds: number;
  totalActualSeconds: number;
  completedAt: Date;
};

export type EstimationAccuracyResponse = {
  data: EstimationAccuracyItem[];
  totalCount: number;
};

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }
    const { page, pageSize } = validation.data;
    const offset = (page - 1) * pageSize;

    // --- THIS IS THE FIX ---
    // The JOINs have been changed to LEFT JOINs.
    // This ensures that we get all archived goals, and if they are missing an estimate
    // or actual time, COALESCE will correctly handle it as 0.
    const [data, totalCountResult] = await prisma.$transaction([
      prisma.$queryRaw<EstimationAccuracyItem[]>`
        WITH "EstimatedTimes" AS (
          SELECT "goalId", SUM("estimatedTimeSeconds")::bigint as "totalEstimatedSeconds"
          FROM "Task" WHERE "userId" = ${userId} GROUP BY "goalId"
        ), "ActualTimes" AS (
          SELECT "goalId", SUM("durationSeconds")::bigint as "totalActualSeconds"
          FROM "FocusSession" WHERE "userId" = ${userId} GROUP BY "goalId"
        )
        SELECT
          g.id as "goalId", g.title as "goalTitle", g."updatedAt" as "completedAt",
          COALESCE(est."totalEstimatedSeconds", 0) as "totalEstimatedSeconds",
          COALESCE(act."totalActualSeconds", 0) as "totalActualSeconds"
        FROM "Goal" g
        LEFT JOIN "EstimatedTimes" est ON g.id = est."goalId"
        LEFT JOIN "ActualTimes" act ON g.id = act."goalId"
        WHERE
          g."userId" = ${userId} AND g.status = 'ARCHIVED'
          -- The filtering logic should happen AFTER joining to get a correct total count.
          -- We will filter in the application or adjust the count query.
          -- For now, this returns all archived goals.
        ORDER BY g."updatedAt" DESC
        LIMIT ${pageSize} OFFSET ${offset};
      `,
      // The count query should match the logic of what we consider a "valid" item for the report.
      // A valid item is an archived goal that has at least SOME estimated time.
      prisma.goal.count({
        where: {
          userId,
          status: 'ARCHIVED',
          tasks: { some: { estimatedTimeSeconds: { gt: 0 } } },
        },
      }),
    ]);

    // Now, filter out the goals that have neither estimated nor actual time, as they are not useful for this report.
    const filteredData = data.filter(
      (item) => item.totalEstimatedSeconds > 0 || item.totalActualSeconds > 0
    );

    const serializedData = filteredData.map((item) => ({
      ...item,
      totalEstimatedSeconds: Number(item.totalEstimatedSeconds),
      totalActualSeconds: Number(item.totalActualSeconds),
    }));

    const response: EstimationAccuracyResponse = {
      data: serializedData,
      totalCount: totalCountResult,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/analytics/estimation-accuracy Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
