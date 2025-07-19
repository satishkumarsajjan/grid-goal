import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export type PomodoroStatsData = {
  WORK: number;
  SHORT_BREAK: number;
  LONG_BREAK: number;
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

    const pomodoroCounts = await prisma.focusSession.groupBy({
      by: ['pomodoroCycle'],
      where: {
        userId: session.user.id,
        mode: 'POMODORO',
        pomodoroCycle: {
          in: ['WORK', 'SHORT_BREAK', 'LONG_BREAK'],
        },
        startTime: { gte: startDate, lte: endDate },
      },
      _count: {
        pomodoroCycle: true,
      },
    });

    const result: PomodoroStatsData = {
      WORK: 0,
      SHORT_BREAK: 0,
      LONG_BREAK: 0,
    };

    pomodoroCounts.forEach((item) => {
      if (item.pomodoroCycle) {
        result[item.pomodoroCycle] = item._count.pomodoroCycle;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/analytics/pomodoro-stats Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
