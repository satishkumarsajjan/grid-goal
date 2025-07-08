import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { getDay, getHours, addSeconds } from 'date-fns';

// The shape of our response: a 7x24 matrix and the max value for scaling
export type ProductivityHotspotData = {
  // A 7-day (rows, Sun-Sat) by 24-hour (cols) matrix of total seconds
  heatmap: number[][];
  // The highest value in the heatmap, useful for color scaling on the client
  maxValue: number;
};

// Zod schema for validating query parameters
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

    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startTime: { gte: startDate, lte: endDate },
      },
      select: {
        startTime: true,
        durationSeconds: true,
      },
    });

    // Initialize a 7x24 matrix with zeros
    const heatmap: number[][] = Array(7)
      .fill(0)
      .map(() => Array(24).fill(0));
    let maxValue = 0;

    // Process each session and distribute its duration across the heatmap
    for (const session of focusSessions) {
      let remainingSeconds = session.durationSeconds;
      let currentTime = session.startTime;

      while (remainingSeconds > 0) {
        const day = getDay(currentTime); // 0 (Sun) to 6 (Sat)
        const hour = getHours(currentTime);

        // Calculate seconds until the next hour
        const nextHour = new Date(currentTime);
        nextHour.setHours(hour + 1, 0, 0, 0);
        const secondsToNextHour =
          (nextHour.getTime() - currentTime.getTime()) / 1000;

        // Determine how many seconds to add to the current cell
        const secondsInThisSlot = Math.min(remainingSeconds, secondsToNextHour);

        heatmap[day][hour] += secondsInThisSlot;

        // Update the global max value
        if (heatmap[day][hour] > maxValue) {
          maxValue = heatmap[day][hour];
        }

        // Move time forward and decrease remaining seconds
        remainingSeconds -= secondsInThisSlot;
        currentTime = addSeconds(currentTime, secondsInThisSlot);
      }
    }

    const responseData: ProductivityHotspotData = { heatmap, maxValue };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET /api/analytics/productivity-hotspot Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
