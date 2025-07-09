import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

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

    // Perform both database queries in parallel for maximum efficiency
    const [goal, tasks] = await Promise.all([
      // Fetch the goal, its sessions, and ensure user ownership
      prisma.goal.findUnique({
        where: { id: goalId, userId: userId },
        include: {
          // Include sessions needed for the Pace Chart
          focusSessions: {
            select: {
              startTime: true,
              durationSeconds: true,
            },
          },
        },
      }),
      // Fetch the associated tasks and their spent time
      prisma.task.findMany({
        where: { goalId: goalId, userId: userId },
        orderBy: { sortOrder: 'asc' },
        include: {
          focusSessions: {
            select: {
              durationSeconds: true,
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

    // Process tasks to include totalTimeSpentSeconds
    const tasksWithTime = tasks.map((task) => {
      const totalTimeSpentSeconds = task.focusSessions.reduce(
        (sum, session) => sum + session.durationSeconds,
        0
      );
      // Remove the sessions relation from the final payload to keep it lean
      const { focusSessions, ...taskWithoutSessions } = task;
      return { ...taskWithoutSessions, totalTimeSpentSeconds };
    });

    // Return the unified data payload
    return NextResponse.json({ goal, tasks: tasksWithTime });
  } catch (error) {
    console.error('[API:TASK_LIST_DATA]', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
