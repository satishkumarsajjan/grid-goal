import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
// Import the enums to use them in our filter logic
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

    // Perform both database queries in parallel
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
      // Fetch tasks and include the necessary fields from their sessions for filtering
      prisma.task.findMany({
        where: { goalId: goalId, userId: userId },
        orderBy: { sortOrder: 'asc' },
        include: {
          focusSessions: {
            select: {
              durationSeconds: true,
              mode: true,
              pomodoroCycle: true, // This is essential for our filter
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

    // --- THIS IS THE CORRECTED LOGIC ---
    const tasksWithTime = tasks.map((task) => {
      // Calculate total time spent ONLY on productive sessions for this task.
      const totalTimeSpentSeconds = task.focusSessions.reduce(
        (sum, session) => {
          // THE CRITICAL FIX: Only include time if it's a Stopwatch session
          // or a Pomodoro WORK cycle.
          if (
            session.mode === TimerMode.STOPWATCH ||
            (session.mode === TimerMode.POMODORO &&
              session.pomodoroCycle === PomodoroCycle.WORK)
          ) {
            return sum + session.durationSeconds;
          }
          // Otherwise, it's a break, so don't add its duration.
          return sum;
        },
        0
      );

      // Remove the full sessions array from the final payload to keep it lean.
      const { focusSessions, ...taskWithoutSessions } = task;

      return { ...taskWithoutSessions, totalTimeSpentSeconds };
    });

    // Return the unified data payload with the correctly calculated time
    return NextResponse.json({ goal, tasks: tasksWithTime });
  } catch (error) {
    console.error('[API:TASK_LIST_DATA]', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
