import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { TaskStatus } from '@prisma/client';

// Zod schema for validation
const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

// This file handles requests to /api/tasks/[SOME_ID]

// --- UPDATE a Task (PATCH) ---
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
        { status: 400 }
      );
    }

    // Security Check: Ensure the user owns the task
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

// --- DELETE a Task (DELETE) ---
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API:DELETE_TASK]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
