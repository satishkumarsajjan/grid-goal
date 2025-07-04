import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    // --- NEW, MORE POWERFUL QUERY ---
    // This query fetches every goal and, for each one, calculates two new fields:
    // totalTasks and completedTasks. This is highly efficient.
    const goalsWithCounts: any[] = await prisma.$queryRaw`
      WITH RECURSIVE "GoalHierarchy" AS (
        SELECT id, "parentId" FROM "Goal" WHERE "userId" = ${userId}
        UNION ALL
        SELECT g.id, g."parentId" FROM "Goal" g
        INNER JOIN "GoalHierarchy" gh ON g."parentId" = gh.id
      )
      SELECT 
        g.*,
        (
          SELECT COUNT(*) 
          FROM "Task" t 
          WHERE t."goalId" IN (SELECT id FROM "GoalHierarchy" WHERE id = g.id OR "parentId" = g.id)
        ) as "totalTasks",
        (
          SELECT COUNT(*) 
          FROM "Task" t 
          WHERE t."goalId" IN (SELECT id FROM "GoalHierarchy" WHERE id = g.id OR "parentId" = g.id) AND t.status = 'COMPLETED'
        ) as "completedTasks"
      FROM "Goal" g
      WHERE g."userId" = ${userId}
      ORDER BY g."createdAt" ASC;
    `;

    // Prisma's raw query returns BigInt for counts, so we convert them.
    const processedGoals = goalsWithCounts.map((g) => ({
      ...g,
      totalTasks: Number(g.totalTasks),
      completedTasks: Number(g.completedTasks),
    }));

    return NextResponse.json(processedGoals);
  } catch (error) {
    console.error('[API:GET_GOAL_TREE_WITH_PROGRESS]', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500 }
    );
  }
}
