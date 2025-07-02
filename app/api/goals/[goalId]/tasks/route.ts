import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// This function handles GET requests to /api/goals/[SOME_GOAL_ID]/tasks
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
    const userId = session.user.id;
    const { goalId } = await params;

    // Security check: ensure the user owns the goal they are requesting tasks for
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return new NextResponse(
        JSON.stringify({ error: 'Goal not found or permission denied' }),
        { status: 404 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        goalId: goalId,
        userId: userId, // Redundant but good for security belt-and-suspenders
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[API:GET_GOAL_TASKS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
