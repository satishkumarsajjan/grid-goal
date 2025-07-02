import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Your NextAuth session handler
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

// This function handles POST requests to /api/goals
export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    // 2. Parse and validate the request body
    const body = await request.json();
    const validation = createGoalSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }
    const { title, description, parentId } = validation.data;

    // 3. Perform the database operation
    const newGoal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        parentId,
      },
    });

    // 4. Return a successful response
    return NextResponse.json(newGoal, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('[API:CREATE_GOAL]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
