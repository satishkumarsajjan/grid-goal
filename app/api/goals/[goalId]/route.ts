import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// This file handles requests to /api/goals/[SOME_ID]

// --- UPDATE a Goal (PATCH) ---
export async function PATCH(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { goalId } = params;

    const body = await request.json();
    // NOTE: You would use a Zod schema here for validation as well.
    const { title, description, status, deadline } = body;

    // Security Check: Ensure the user owns this goal before updating
    const goalToUpdate = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!goalToUpdate) {
      return new NextResponse(
        JSON.stringify({
          error: 'Goal not found or you do not have permission',
        }),
        { status: 404 }
      );
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { title, description, status, deadline },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('[API:UPDATE_GOAL]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

// --- DELETE a Goal (DELETE) ---
export async function DELETE(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { goalId } = params;

    // Security Check: Ensure the user owns this goal before deleting
    const goalToDelete = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!goalToDelete) {
      return new NextResponse(
        JSON.stringify({
          error: 'Goal not found or you do not have permission',
        }),
        { status: 404 }
      );
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error('[API:DELETE_GOAL]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
