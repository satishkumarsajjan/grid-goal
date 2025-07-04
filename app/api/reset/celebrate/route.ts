import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { subDays, startOfDay } from 'date-fns';
import { SessionVibe } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  const today = startOfDay(new Date());
  const sevenDaysAgo = startOfDay(subDays(today, 6)); // Include today + the 6 previous days

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId: session.user.id,
      startTime: { gte: sevenDaysAgo },
    },
    select: {
      durationSeconds: true,
      vibe: true,
    },
  });

  // Process the data on the server
  const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const vibeCounts = {
    [SessionVibe.FLOW]: sessions.filter((s) => s.vibe === SessionVibe.FLOW)
      .length,
    [SessionVibe.NEUTRAL]: sessions.filter(
      (s) => s.vibe === SessionVibe.NEUTRAL
    ).length,
    [SessionVibe.STRUGGLE]: sessions.filter(
      (s) => s.vibe === SessionVibe.STRUGGLE
    ).length,
  };

  const totalSessions = sessions.length;

  return NextResponse.json({
    totalSeconds,
    totalSessions,
    vibeCounts,
  });
}
