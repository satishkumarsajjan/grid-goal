import { auth } from '@/auth';
import { AwardService } from '@/lib/services/award.service';
import { prisma } from '@/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> }
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

    const [sessions, tasks, timePerTask] = await Promise.all([
      prisma.focusSession.findMany({
        where: { goalId: { in: allIdsInHierarchy } },
        orderBy: { startTime: 'asc' },
        select: { startTime: true, durationSeconds: true },
      }),
      prisma.task.findMany({
        where: { goalId: goalId, userId: userId },
        orderBy: { sortOrder: 'asc' },
      }),

      prisma.focusSession.groupBy({
        by: ['taskId'],
        where: {
          goalId: goalId,
          userId: userId,

          OR: [{ pomodoroCycle: 'WORK' }, { mode: 'STOPWATCH' }],
        },
        _sum: { durationSeconds: true },
      }),
    ]);

    const timeMap = timePerTask.reduce((acc, curr) => {
      acc[curr.taskId] = curr._sum.durationSeconds || 0;
      return acc;
    }, {} as Record<string, number>);

    const tasksWithTime = tasks.map((task) => ({
      ...task,
      totalTimeSpentSeconds: timeMap[task.id] || 0,
    }));

    const responsePayload = {
      ...goalOwnerCheck,
      focusSessions: sessions,
      tasks: tasksWithTime,
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

const updateGoalSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
    deadline: z.coerce.date().optional().nullable(),
    color: z.string().startsWith('#').length(7).optional().nullable(),
    categoryId: z.string().optional().nullable(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> }
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
    const validation = updateGoalSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const dataToUpdate = validation.data;

    const goalToUpdate = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goalToUpdate) {
      return new NextResponse(
        JSON.stringify({ error: 'Goal not found or permission denied' }),
        { status: 404 }
      );
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: dataToUpdate,
      include: { category: true },
    });

    try {
      await AwardService.processAwards(userId, 'GOAL_UPDATED', updatedGoal);
    } catch (awardError) {
      console.error('Failed to process goal-update awards:', awardError);
    }

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
  { params }: { params: Promise<{ goalId: string }> }
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
