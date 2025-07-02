import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Zod schema for validation
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255),
  goalId: z.string().cuid('Invalid Goal ID'),
});

// This function handles POST requests to /api/tasks
export async function POST(request: Request) {
  try {
    // 1. Authenticate & Authorize
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    // 2. Validate request body
    const body = await request.json();
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }
    const { title, goalId } = validation.data;

    // Security Check: Verify that the user owns the goal they are adding a task to.
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

    // 3. Perform the database operation
    // Get the highest current sortOrder for this goal and add 1
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
