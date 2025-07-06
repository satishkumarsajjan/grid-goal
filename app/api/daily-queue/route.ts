// app/api/daily-queue/route.ts

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

    // 1. Handle the dynamic 'includeGoal' query parameter
    const { searchParams } = new URL(request.url);
    const includeGoal = searchParams.get('includeGoal') === 'true';

    // 2. Build the Prisma 'include' object dynamically and type-safely
    const include: Prisma.DailyQueueItemInclude = {
      task: {
        // We always include the task
        include: {
          // But only include the goal if the query param is set
          goal: includeGoal,
        },
      },
    };

    const queueItems = await prisma.dailyQueueItem.findMany({
      where: { userId: session.user.id },
      include, // Use the dynamically constructed include object
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

    // 3. Use a database transaction to ensure atomicity and prevent race conditions
    const newItem = await prisma.$transaction(async (tx) => {
      // 4. Validate that the task exists and belongs to the user
      const task = await tx.task.findUnique({
        where: { id: taskId, userId },
      });

      if (!task) {
        // Throwing an error within the transaction will automatically roll it back.
        // We will catch this specific error type outside the transaction.
        throw new Error('TaskNotFound');
      }

      // Check if the task is already in the queue
      const existingQueueItem = await tx.dailyQueueItem.findFirst({
        where: { userId, taskId },
      });

      if (existingQueueItem) {
        throw new Error('TaskAlreadyInQueue');
      }

      // Find the current max sortOrder within the transaction for consistency
      const maxSortOrderItem = await tx.dailyQueueItem.findFirst({
        where: { userId },
        orderBy: { sortOrder: 'desc' },
      });

      const newSortOrder = (maxSortOrderItem?.sortOrder ?? -1) + 1;

      // Create the new item and return it with the full task details included
      return tx.dailyQueueItem.create({
        data: {
          userId,
          taskId,
          sortOrder: newSortOrder,
        },
        include: { task: true }, // 5. Return the rich object
      });
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    // 6. Handle specific, known errors with appropriate client responses
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
          { status: 409 } // 409 Conflict is a good status code for this
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
