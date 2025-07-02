import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { TaskStatus } from '@prisma/client';

// --- Zod Schema for PATCH Validation ---
const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

// ====================================================================
// --- GET a Single Task's Details ---
// ====================================================================
export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { taskId } = params;

    if (!taskId) {
      return new NextResponse(
        JSON.stringify({ error: 'Task ID is required' }),
        {
          status: 400,
        }
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId, // Security check to ensure the user owns this task
      },
    });

    if (!task) {
      return new NextResponse(
        JSON.stringify({ error: 'Task not found or permission denied' }),
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[API:GET_SINGLE_TASK]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

// ====================================================================
// --- UPDATE a Task (PATCH) ---
// ====================================================================
export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { taskId } = params;

    const body = await request.json();
    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        {
          status: 400,
        }
      );
    }

    // Security Check: Find the task first to ensure ownership before updating
    const taskToUpdate = await prisma.task.findFirst({
      where: { id: taskId, userId: userId },
    });

    if (!taskToUpdate) {
      return new NextResponse(
        JSON.stringify({
          error: 'Task not found or you do not have permission',
        }),
        { status: 404 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: validation.data,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('[API:UPDATE_TASK]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

// ====================================================================
// --- DELETE a Task (DELETE) ---
// ====================================================================
export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { taskId } = params;

    // Security Check
    const taskToDelete = await prisma.task.findFirst({
      where: { id: taskId, userId: userId },
    });

    if (!taskToDelete) {
      return new NextResponse(
        JSON.stringify({
          error: 'Task not found or you do not have permission',
        }),
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful deletions
  } catch (error) {
    console.error('[API:DELETE_TASK]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
