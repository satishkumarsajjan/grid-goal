import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { createTaskSchema } from '@/lib/zod-schemas'; // Assuming you have this schema

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const includeGoal = searchParams.get('includeGoal') === 'true';

    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,

        status: {
          not: 'COMPLETED',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        goal: includeGoal ? { select: { title: true } } : false,
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[API:GET_ALL_TASKS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const body = await request.json();

    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const { title, goalId, estimatedTimeInHours } = validation.data;
    const estimatedTimeInSeconds = (estimatedTimeInHours ?? 0) * 3600;

    const parentGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!parentGoal) {
      return new NextResponse(
        JSON.stringify({
          error: 'Goal not found or you do not have permission',
        }),
        { status: 404 }
      );
    }

    const lastTask = await prisma.task.findFirst({
      where: { goalId: goalId },
      orderBy: { sortOrder: 'desc' },
    });
    const newSortOrder = (lastTask?.sortOrder ?? -1) + 1;

    const newTask = await prisma.task.create({
      data: {
        userId,
        goalId,
        title,
        sortOrder: newSortOrder,

        estimatedTimeSeconds: estimatedTimeInSeconds,
      },
    });

    // 4. Return a successful response
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('[API:CREATE_TASK]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
