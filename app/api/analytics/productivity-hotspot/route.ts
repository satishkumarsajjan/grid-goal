import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { getDay, getHours, addSeconds } from 'date-fns';

export type PeakTime = {
  day: number; // 0-6
  hour: number; // 0-23
} | null;

export type ProductivityHotspotData = {
  heatmap: number[][];
  maxValue: number;
  peakTime: PeakTime;
  totalHours: number;
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

    const focusSessions = await prisma.focusSession.findMany({
      where: { userId, startTime: { gte: startDate, lte: endDate } },
      select: { startTime: true, durationSeconds: true },
    });

    const heatmap: number[][] = Array(7)
      .fill(0)
      .map(() => Array(24).fill(0));
    let maxValue = 0;
    let peakTime: PeakTime = null;
    let totalSeconds = 0;

    for (const session of focusSessions) {
      totalSeconds += session.durationSeconds;
      let remainingSeconds = session.durationSeconds;
      let currentTime = session.startTime;

      while (remainingSeconds > 0) {
        const day = getDay(currentTime);
        const hour = getHours(currentTime);
        const nextHour = new Date(currentTime);
        nextHour.setHours(hour + 1, 0, 0, 0);
        const secondsToNextHour =
          (nextHour.getTime() - currentTime.getTime()) / 1000;
        const secondsInThisSlot = Math.min(remainingSeconds, secondsToNextHour);

        heatmap[day][hour] += secondsInThisSlot;

        if (heatmap[day][hour] > maxValue) {
          maxValue = heatmap[day][hour];
          peakTime = { day, hour };
        }

        remainingSeconds -= secondsInThisSlot;
        currentTime = addSeconds(currentTime, secondsInThisSlot);
      }
    }

    const responseData: ProductivityHotspotData = {
      heatmap,
      maxValue,
      peakTime,
      totalHours: totalSeconds / 3600,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET /api/analytics/productivity-hotspot Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
