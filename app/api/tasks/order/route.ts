import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Zod schema for the array of tasks to reorder
const updateTaskOrderSchema = z.array(
  z.object({
    id: z.string().cuid(),
    sortOrder: z.number().int(),
  })
);

// This function handles PATCH requests to /api/tasks/order
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = updateTaskOrderSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }
    const tasksToUpdate = validation.data;

    // To ensure security, we'll run all updates within a transaction.
    // Prisma's $transaction lets us do this efficiently.
    const transactions = tasksToUpdate.map((task) =>
      prisma.task.update({
        where: {
          // IMPORTANT: We include userId here to ensure a user can't reorder someone else's tasks.
          id: task.id,
          userId: userId,
        },
        data: {
          sortOrder: task.sortOrder,
        },
      })
    );

    await prisma.$transaction(transactions);

    return NextResponse.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('[API:UPDATE_TASK_ORDER]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
