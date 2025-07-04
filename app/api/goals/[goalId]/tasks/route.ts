import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// This function handles GET requests to e.g., /api/goals/some-goal-id/tasks
export async function GET(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const goalId = params.goalId;
    const userId = session.user.id;

    // Security check: Ensure the user owns the goal they are requesting tasks for.
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!goal) {
      return new NextResponse(
        JSON.stringify({ error: 'Goal not found or access denied' }),
        { status: 404 }
      );
    }

    // --- THE FIX IS HERE ---
    // 1. Fetch all tasks for the goal.
    // 2. Use `include` to also fetch all related focus sessions for each task.
    const tasks = await prisma.task.findMany({
      where: { goalId: goalId },
      orderBy: { sortOrder: 'asc' },
      include: {
        // We tell Prisma to pull in all focus sessions related to this task.
        focusSessions: {
          // We only need the durationSeconds for our calculation. This is efficient.
          select: {
            durationSeconds: true,
          },
        },
      },
    });

    // 3. Process the tasks to add the calculated `totalTimeSeconds` property.
    const tasksWithTime = tasks.map((task) => {
      // For each task, sum up the duration of all its sessions.
      const totalSeconds = task.focusSessions.reduce(
        (sum, session) => sum + session.durationSeconds,
        0
      );

      // We don't need to send the whole focusSessions array to the client.
      const { focusSessions, ...taskData } = task;

      // Return a new object with our calculated property.
      return {
        ...taskData,
        totalTimeSeconds: totalSeconds,
      };
    });

    // 4. Return the enhanced data to the frontend.
    return NextResponse.json(tasksWithTime);
  } catch (error) {
    console.error('[API:GET_TASKS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
