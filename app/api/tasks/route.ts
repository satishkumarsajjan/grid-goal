import { auth } from '@/auth';
import { updateGoalTreeEstimates } from '@/lib/goal-estimate-updater';
import { AwardService } from '@/lib/services/award.service';
import { prisma } from '@/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  goalId: z.string().cuid('Invalid Goal ID.'),

  estimatedTimeSeconds: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const includeGoal = searchParams.get('includeGoal') === 'true';

    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        status: { not: 'COMPLETED' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        goal: includeGoal ? { select: { title: true } } : false,
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[API:GET_ALL_TASKS]', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();

    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { title, goalId, estimatedTimeSeconds } = validation.data;

    const newTask = await prisma.$transaction(async (tx) => {
      const parentGoal = await tx.goal.findUnique({
        where: { id: goalId, userId: userId },
      });
      if (!parentGoal) throw new Error('Goal not found or permission denied.');

      const lastTask = await tx.task.findFirst({
        where: { goalId: goalId },
        orderBy: { sortOrder: 'desc' },
      });
      const newSortOrder = (lastTask?.sortOrder ?? -1) + 1;

      const createdTask = await tx.task.create({
        data: {
          userId,
          goalId,
          title,
          sortOrder: newSortOrder,
          estimatedTimeSeconds,
        },
      });

      await updateGoalTreeEstimates(goalId, tx);
      return createdTask;
    });

    try {
      await AwardService.processAwards(userId, 'TASK_CREATED');
    } catch (awardError) {
      console.error('Failed to process task-creation awards:', awardError);
    }
    return NextResponse.json(newTask, { status: 201 });
  } catch (error: unknown) {
    console.error('[API:CREATE_TASK]', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Goal not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
