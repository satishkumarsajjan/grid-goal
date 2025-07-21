import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export type WeeklyBalanceData = {
  dayOfWeek: number;
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
