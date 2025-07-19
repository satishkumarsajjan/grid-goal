import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/daily-queue
 *
 * Fetches the user's daily queue items.
 * Supports an optional query parameter `includeGoal=true` to also fetch the
 * goal associated with each task.
 *
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A JSON response with the queue items.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeGoal = searchParams.get('includeGoal') === 'true';

    const include: Prisma.DailyQueueItemInclude = {
      task: {
        include: {
          goal: includeGoal,
        },
      },
    };

    const queueItems = await prisma.dailyQueueItem.findMany({
      where: { userId: session.user.id },
      include,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(queueItems);
  } catch (error) {
    console.error('GET /api/daily-queue Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-queue
 *
 * Adds a new task to the user's daily queue.
 * This operation is wrapped in a transaction to prevent race conditions when
 * determining the new sortOrder.
 *
 * @param {Request} request - The incoming request object containing a `taskId`.
 * @returns {NextResponse} A JSON response with the newly created queue item.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { taskId } = await request.json();
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const newItem = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId, userId },
      });

      if (!task) {
        throw new Error('TaskNotFound');
      }

      const existingQueueItem = await tx.dailyQueueItem.findFirst({
        where: { userId, taskId },
      });

      if (existingQueueItem) {
        throw new Error('TaskAlreadyInQueue');
      }

      const maxSortOrderItem = await tx.dailyQueueItem.findFirst({
        where: { userId },
        orderBy: { sortOrder: 'desc' },
      });

      const newSortOrder = (maxSortOrderItem?.sortOrder ?? -1) + 1;

      return tx.dailyQueueItem.create({
        data: {
          userId,
          taskId,
          sortOrder: newSortOrder,
        },
        include: { task: true },
      });
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TaskNotFound') {
        return NextResponse.json(
          { error: 'Task not found or you do not have permission to add it.' },
          { status: 404 }
        );
      }
      if (error.message === 'TaskAlreadyInQueue') {
        return NextResponse.json(
          { error: 'This task is already in your daily queue.' },
          { status: 409 }
        );
      }
    }

    console.error('POST /api/daily-queue Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
