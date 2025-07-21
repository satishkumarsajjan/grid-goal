import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

interface GoalWithCounts {
  id: string;
  title: string;
  description: string | null;
  parentId: string | null;
  userId: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  totalTasks: bigint;
  completedTasks: bigint;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const goalsWithCounts: GoalWithCounts[] = await prisma.$queryRaw`
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

    // Convert bigint counts to numbers for JSON serialization
    const serializedGoals = goalsWithCounts.map((goal) => ({
      ...goal,
      totalTasks: Number(goal.totalTasks),
      completedTasks: Number(goal.completedTasks),
    }));

    return NextResponse.json(serializedGoals);
  } catch (error) {
    console.error('Error fetching goals tree:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
