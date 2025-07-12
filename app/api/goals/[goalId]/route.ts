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
      include: { category: true },
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
    const allIdsInHierarchy = goalAndSubGoalIds.map((g) => g.id);

    // --- THIS IS THE FIX ---
    // We run all three data fetches in parallel for maximum efficiency.
    const [sessions, tasks, timePerTask] = await Promise.all([
      // 1. Fetch focus sessions for the entire goal hierarchy (for pace indicator)
      prisma.focusSession.findMany({
        where: { goalId: { in: allIdsInHierarchy } },
        orderBy: { startTime: 'asc' },
        select: { startTime: true, durationSeconds: true },
      }),
      // 2. Fetch the raw tasks for the specific goal
      prisma.task.findMany({
        where: { goalId: goalId, userId: userId },
        orderBy: { sortOrder: 'asc' },
      }),
      // 3. NEW: Fetch the aggregated time spent per task for this goal
      prisma.focusSession.groupBy({
        by: ['taskId'],
        where: {
          goalId: goalId,
          userId: userId,
        },
        _sum: {
          durationSeconds: true,
        },
      }),
    ]);

    // Create a simple map for easy lookup of time spent per task
    const timeMap = timePerTask.reduce((acc, curr) => {
      acc[curr.taskId] = curr._sum.durationSeconds || 0;
      return acc;
    }, {} as Record<string, number>);

    // Combine the raw task data with the calculated time spent
    const tasksWithTime = tasks.map((task) => ({
      ...task,
      totalTimeSpentSeconds: timeMap[task.id] || 0,
    }));
    // --- END OF FIX ---

    const responsePayload = {
      ...goalOwnerCheck,
      focusSessions: sessions,
      tasks: tasksWithTime, // Return the newly enriched tasks array
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('[API:GET_GOAL_DETAILS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}

// --- PATCH and DELETE handlers remain unchanged ---
export async function PATCH(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  /* ... unchanged ... */ try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;
    const { goalId } = params;
    const body = await request.json();
    const { title, description, status, deadline, color, categoryId } = body;
    const goalToUpdate = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goalToUpdate) {
      return new NextResponse(JSON.stringify({ error: 'Goal not found' }), {
        status: 404,
      });
    }
    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (status !== undefined) dataToUpdate.status = status;
    if (deadline !== undefined) dataToUpdate.deadline = deadline;
    if (color !== undefined) dataToUpdate.color = color;
    if (categoryId !== undefined) {
      dataToUpdate.categoryId = categoryId;
    }
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: dataToUpdate,
      include: { category: true },
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
  /* ... unchanged ... */ try {
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
    await prisma.goal.delete({ where: { id: goalId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API:DELETE_GOAL]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
