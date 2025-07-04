import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// This function handles GET requests to /api/goals/[goalId]
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

    // First, verify the user owns the goal they are requesting.
    const goalOwnerCheck = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!goalOwnerCheck) {
      return new NextResponse(
        JSON.stringify({ error: 'Goal not found or access denied' }),
        { status: 404 }
      );
    }

    // Use a recursive raw query to find the ID of the parent goal AND all its nested sub-goals.
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

    // Fetch the main goal's details AND all focus sessions from the entire hierarchy in parallel.
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

    // Return the goal details with the focus sessions nested inside.
    return NextResponse.json({ ...goalDetails, focusSessions: sessions });
  } catch (error) {
    console.error('[API:GET_GOAL_DETAILS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
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
    const { goalId } = await params;

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
    const { goalId } = await params;

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
