import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { TaskStatus } from '@prisma/client';

// This function handles GET requests to /api/tasks/actionable
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    // Fetch all tasks for the user that are NOT completed
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        status: {
          not: TaskStatus.COMPLETED,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[API:GET_ACTIONABLE_TASKS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
