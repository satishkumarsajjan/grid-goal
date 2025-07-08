import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Define the shape of the data returned by our query
export type WeeklyBalanceData = {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  totalSeconds: number;
};

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
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }
    const { startDate, endDate } = validation.data;

    // Use a raw query to extract the day of the week (DOW) and sum durations.
    // EXTRACT(DOW FROM ...) is the standard SQL way to do this. 0=Sun, 6=Sat.
    const result = await prisma.$queryRaw<WeeklyBalanceData[]>`
      SELECT
        EXTRACT(DOW FROM "startTime")::int as "dayOfWeek",
        SUM("durationSeconds")::bigint as "totalSeconds"
      FROM "FocusSession"
      WHERE
        "userId" = ${userId}
        AND "startTime" >= ${startDate}
        AND "startTime" <= ${endDate}
      GROUP BY "dayOfWeek"
      ORDER BY "dayOfWeek" ASC;
    `;

    // Convert BigInt to Number for JSON compatibility
    const serializedResult = result.map((item) => ({
      ...item,
      totalSeconds: Number(item.totalSeconds),
    }));

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error('GET /api/analytics/weekly-balance Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
