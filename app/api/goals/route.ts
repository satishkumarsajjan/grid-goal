import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { createGoalSchema } from '@/lib/zod-schemas';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const goals = await prisma.goal.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('[API:GET_GOALS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = createGoalSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const { title, description, parentId, deadline, estimatedTimeSeconds } =
      validation.data;

    if (parentId) {
      const parentGoal = await prisma.goal.findFirst({
        where: { id: parentId, userId: userId },
      });
      if (!parentGoal) {
        return new NextResponse(
          JSON.stringify({ error: 'Parent goal not found or access denied.' }),
          { status: 404 }
        );
      }
    }

    const newGoal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        parentId,
        deadline,

        estimatedTimeSeconds,
      },
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('[API:CREATE_GOAL]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
