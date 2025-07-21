import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

const updateTaskOrderSchema = z.array(
  z.object({
    id: z.string().cuid(),
    sortOrder: z.number().int(),
  })
);

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

    const transactions = tasksToUpdate.map((task) =>
      prisma.task.update({
        where: {
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
