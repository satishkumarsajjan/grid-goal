import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

import { TimerMode, PomodoroCycle } from '@prisma/client';

const querySchema = z.object({
  goalId: z.string().cuid('Invalid Goal ID.'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      goalId: searchParams.get('goalId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }
    const { goalId } = validation.data;

    const [goal, tasks] = await Promise.all([
      prisma.goal.findUnique({
        where: { id: goalId, userId: userId },
        include: {
          focusSessions: {
            select: {
              startTime: true,
              durationSeconds: true,
            },
          },
        },
      }),

      prisma.task.findMany({
        where: { goalId: goalId, userId: userId },
        orderBy: { sortOrder: 'asc' },
        include: {
          focusSessions: {
            select: {
              durationSeconds: true,
              mode: true,
              pomodoroCycle: true,
            },
          },
        },
      }),
    ]);

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found or permission denied' },
        { status: 404 }
      );
    }

    const tasksWithTime = tasks.map((task) => {
      const totalTimeSpentSeconds = task.focusSessions.reduce(
        (sum, session) => {
          if (
            session.mode === TimerMode.STOPWATCH ||
            (session.mode === TimerMode.POMODORO &&
              session.pomodoroCycle === PomodoroCycle.WORK)
          ) {
            return sum + session.durationSeconds;
          }

          return sum;
        },
        0
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { focusSessions, ...taskWithoutSessions } = task;

      return { ...taskWithoutSessions, totalTimeSpentSeconds };
    });

    return NextResponse.json({ goal, tasks: tasksWithTime });
  } catch (error) {
    console.error('[API:TASK_LIST_DATA]', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
