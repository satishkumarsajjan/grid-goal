import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { GoalStatus, TaskStatus } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse('Unauthorized', { status: 401 });

  // Fetch all actionable tasks from active goals
  const actionableTasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: {
        in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
      },
      goal: {
        status: GoalStatus.ACTIVE,
      },
    },
    include: {
      goal: {
        // Include the parent goal's title for context
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return NextResponse.json(actionableTasks);
}
