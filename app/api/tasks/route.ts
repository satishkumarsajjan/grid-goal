import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod'; // Assuming this comes from your lib
import { updateGoalTreeEstimates } from '@/lib/goal-estimate-updater';
import { AwardService } from '@/lib/services/award.service';

// Define the schema here for clarity or import it from your lib
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  goalId: z.string().cuid('Invalid Goal ID.'),
  // We'll expect seconds directly now for consistency with the DB
  estimatedTimeSeconds: z.number().int().min(0).optional(),
});

// --- GET Function (Unchanged, but reformatted for consistency) ---
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

// --- POST Function (Completely Re-implemented with Best Practices) ---
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    // It validates against the correct API schema.
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // It correctly destructures estimatedTimeSeconds.
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
          estimatedTimeSeconds, // This will now be populated correctly.
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
  } catch (error: any) {
    console.error('[API:CREATE_TASK]', error);
    if (error.message.includes('Goal not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
