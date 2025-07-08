import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// Define the shape of the data returned by our complex query
export type EstimationAccuracyData = {
  goalId: string;
  goalTitle: string;
  totalEstimatedSeconds: number;
  totalActualSeconds: number;
  completedAt: Date;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // This query uses Common Table Expressions (CTEs) for clarity and performance.
    // 1. `EstimatedTimes`: Aggregates estimated time per goal from Tasks.
    // 2. `ActualTimes`: Aggregates actual tracked time per goal from FocusSessions.
    // The final SELECT joins these two sets of data on the goal ID.
    const result = await prisma.$queryRaw<EstimationAccuracyData[]>`
      WITH "EstimatedTimes" AS (
        SELECT
          "goalId",
          SUM("estimatedTimeSeconds")::bigint as "totalEstimatedSeconds"
        FROM "Task"
        WHERE "userId" = ${userId}
        GROUP BY "goalId"
      ),
      "ActualTimes" AS (
        SELECT
          "goalId",
          SUM("durationSeconds")::bigint as "totalActualSeconds"
        FROM "FocusSession"
        WHERE "userId" = ${userId}
        GROUP BY "goalId"
      )
      SELECT
        g.id as "goalId",
        g.title as "goalTitle",
        g."updatedAt" as "completedAt", -- "updatedAt" on an ARCHIVED goal is its completion date
        COALESCE(est."totalEstimatedSeconds", 0) as "totalEstimatedSeconds",
        COALESCE(act."totalActualSeconds", 0) as "totalActualSeconds"
      FROM "Goal" g
      JOIN "EstimatedTimes" est ON g.id = est."goalId"
      JOIN "ActualTimes" act ON g.id = act."goalId"
      WHERE
        g."userId" = ${userId}
        AND g.status = 'ARCHIVED'
        AND est."totalEstimatedSeconds" > 0
        AND act."totalActualSeconds" > 0 -- Ensure we only get goals with both estimates and actuals
      ORDER BY
        g."updatedAt" DESC
      LIMIT 10; -- Limit to the 10 most recently completed goals for relevance
    `;

    // Convert BigInts from the SUM to Numbers for JSON compatibility.
    const serializedResult = result.map((item) => ({
      ...item,
      totalEstimatedSeconds: Number(item.totalEstimatedSeconds),
      totalActualSeconds: Number(item.totalActualSeconds),
    }));

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error('GET /api/analytics/estimation-accuracy Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
