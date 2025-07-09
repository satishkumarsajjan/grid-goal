import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { TaskStatus } from '@prisma/client';
import { updateGoalTreeEstimates } from '@/lib/goal-estimate-updater';

// --- Zod Schema for PATCH Validation (FIXED) ---
// Now includes the estimatedTimeSeconds field.
const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  estimatedTimeSeconds: z
    .number()
    .int()
    .min(0, 'Estimate cannot be negative')
    .optional(),
});

// ====================================================================
// --- GET a Single Task's Details (Unchanged, but reformatted for consistency) ---
// ====================================================================
export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { taskId } = params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId, // Security check
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or permission denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[API:GET_SINGLE_TASK]', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}

// ====================================================================
// --- UPDATE a Task (PATCH) - (Re-implemented with Best Practices) ---
// ====================================================================
export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { taskId } = params;

    const body = await request.json();
    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // FIX: All operations are wrapped in a transaction.
    const updatedTask = await prisma.$transaction(async (tx) => {
      // 1. Find the task to ensure it exists and the user owns it.
      const taskToUpdate = await tx.task.findUnique({
        where: { id: taskId, userId: userId },
      });

      if (!taskToUpdate) {
        throw new Error('Task not found or permission denied.');
      }

      // 2. Update the task with the new data.
      const task = await tx.task.update({
        where: { id: taskId },
        data: validation.data,
      });

      // 3. THE CRITICAL FIX: If the estimate changed, trigger the tree update.
      // This check prevents running the expensive update on a simple status change.
      if (validation.data.estimatedTimeSeconds !== undefined) {
        await updateGoalTreeEstimates(task.goalId, tx);
      }

      return task;
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('[API:UPDATE_TASK]', error);
    if (error.message.includes('Task not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}

// ====================================================================
// --- DELETE a Task (DELETE) - (Re-implemented with Best Practices) ---
// ====================================================================
export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { taskId } = params;

    // FIX: All operations are wrapped in a transaction.
    await prisma.$transaction(async (tx) => {
      // 1. Find the task first to get its goalId and ensure ownership.
      const taskToDelete = await tx.task.findUnique({
        where: { id: taskId, userId: userId },
        select: { goalId: true, estimatedTimeSeconds: true }, // Select the estimate to check if an update is needed
      });

      if (!taskToDelete) {
        throw new Error('Task not found or permission denied.');
      }

      // 2. Delete the actual task.
      await tx.task.delete({
        where: { id: taskId },
      });

      // 3. THE CRITICAL FIX: If the deleted task had an estimate, trigger the tree update.
      if (
        taskToDelete.estimatedTimeSeconds &&
        taskToDelete.estimatedTimeSeconds > 0
      ) {
        await updateGoalTreeEstimates(taskToDelete.goalId, tx);
      }
    });

    // 204 No Content is the standard, correct response for a successful deletion.
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('[API:DELETE_TASK]', error);
    if (error.message.includes('Task not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
