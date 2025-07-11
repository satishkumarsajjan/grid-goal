import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET(
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
    const goalId = params.goalId;

    const goalOwnerCheck = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!goalOwnerCheck) {
      return new NextResponse(
        JSON.stringify({ error: 'Goal not found or access denied' }),
        { status: 404 }
      );
    }

    const goalAndSubGoalIds = await prisma.$queryRaw<[{ id: string }]>`
      WITH RECURSIVE "GoalHierarchy" AS (
        SELECT id FROM "Goal" WHERE id = ${goalId}
        UNION ALL
        SELECT g.id FROM "Goal" g
        INNER JOIN "GoalHierarchy" gh ON g."parentId" = gh.id
      )
      SELECT id FROM "GoalHierarchy";
    `;
    const allIds = goalAndSubGoalIds.map((g) => g.id);

    const [goalDetails, sessions] = await Promise.all([
      prisma.goal.findUnique({ where: { id: goalId } }),
      prisma.focusSession.findMany({
        where: { goalId: { in: allIds } },
        orderBy: { startTime: 'asc' },
        select: { startTime: true, durationSeconds: true },
      }),
    ]);

    if (!goalDetails) {
      return new NextResponse(JSON.stringify({ error: 'Goal not found' }), {
        status: 404,
      });
    }

    return NextResponse.json({ ...goalDetails, focusSessions: sessions });
  } catch (error) {
    console.error('[API:GET_GOAL_DETAILS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

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

    const { title, description, status, deadline, color } = body;

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
      // NEW: Include 'color' in the update data payload
      data: { title, description, status, deadline, color },
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API:DELETE_GOAL]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
