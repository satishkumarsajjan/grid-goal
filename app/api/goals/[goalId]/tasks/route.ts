import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

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

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!goal) {
      return new NextResponse(
        JSON.stringify({ error: 'Goal not found or access denied' }),
        { status: 404 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { goalId: goalId },
      orderBy: { sortOrder: 'asc' },
      include: {
        focusSessions: {
          select: {
            durationSeconds: true,
          },
        },
      },
    });

    const tasksWithTime = tasks.map((task) => {
      const totalSeconds = task.focusSessions.reduce(
        (sum, session) => sum + session.durationSeconds,
        0
      );

      const { focusSessions, ...taskData } = task;

      return {
        ...taskData,
        totalTimeSeconds: totalSeconds,
      };
    });

    return NextResponse.json(tasksWithTime);
  } catch (error) {
    console.error('[API:GET_TASKS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
