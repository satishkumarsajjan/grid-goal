import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { type Goal } from '@prisma/client';

import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { GoalCard, GoalCardSkeleton } from '@/components/goals/goal-card';
import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { TaskList } from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';

// This type definition should live in a shared types file (e.g., lib/types.ts)
// but is included here for completeness.
export type GoalWithProgress = Goal & {
  _count: {
    tasks: number;
    completedTasks: number;
  };
};

/**
 * This is the main async Server Component for the entire /goals route.
 * It uses the URL parameter `goalId` to decide whether to show the
 * list of all goals or the detailed view of a single goal.
 */
export default async function GoalsPage({
  params,
}: {
  params: { goalId?: string[] };
}) {
  const selectedGoalId = params.goalId?.[0] ?? null;

  // --- Main Logic: Render Detail View or List View ---

  // Case 1: A specific goal ID is present in the URL.
  // We show the detailed task list for that single goal.
  if (selectedGoalId) {
    // Optional: Verify the goal belongs to the user before showing tasks.
    const session = await auth();
    const goal = await prisma.goal.findFirst({
      where: {
        id: selectedGoalId,
        userId: session?.user?.id,
      },
    });
    if (!goal) {
      notFound(); // If goal doesn't exist or doesn't belong to user, show 404.
    }

    return (
      <div>
        <Button asChild variant='ghost' className='mb-4 -ml-4'>
          <Link href='/goals'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to All Goals
          </Link>
        </Button>
        {/* The TaskList component fetches its own data based on the goalId prop.
            This could also be refactored to receive data, but this pattern is fine. */}
        <TaskList goalId={selectedGoalId} />
      </div>
    );
  }

  // Case 2: No goal ID in the URL. We are at '/goals'.
  // We show the grid of all goal cards.
  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50'>
          Your Goals
        </h1>
        <CreateGoalButton />
      </div>

      {/* Use React Suspense for a great loading experience.
          The skeleton will be shown immediately while the data for GoalsGrid is being fetched. */}
      <Suspense fallback={<GoalsGridSkeleton />}>
        <GoalsGrid />
      </Suspense>
    </div>
  );
}

/**
 * A helper component for rendering the loading state.
 * This is clean and keeps the main component's return statement simple.
 */
function GoalsGridSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <GoalCardSkeleton />
      <GoalCardSkeleton />
      <GoalCardSkeleton />
    </div>
  );
}

/**
 * An async Server Component dedicated to fetching and displaying the grid of goals.
 * This pattern encapsulates the data-fetching logic and allows for streaming UI with Suspense.
 */
async function GoalsGrid() {
  const session = await auth();
  if (!session?.user?.id) {
    // This should not happen due to middleware, but it's a good safeguard.
    return (
      <p className='text-center text-muted-foreground'>
        Please sign in to view your goals.
      </p>
    );
  }
  const userId = session.user.id;

  // The powerful Prisma raw query to get both total and completed task counts efficiently.
  const goalsWithProgressRaw: any[] = await prisma.$queryRaw`
    SELECT 
      g.*,
      (SELECT COUNT(*) FROM "Task" t WHERE t."goalId" = g.id) as "totalTasks",
      (SELECT COUNT(*) FROM "Task" t WHERE t."goalId" = g.id AND t.status = 'COMPLETED') as "completedTasks"
    FROM "Goal" g
    WHERE g."userId" = ${userId}
    ORDER BY g."createdAt" ASC;
  `;

  // Prisma's raw query returns BigInt for counts, so we need to convert them to numbers
  // before passing them to the client component (GoalCard).
  const goals: GoalWithProgress[] = goalsWithProgressRaw.map((g) => ({
    ...g,
    _count: {
      tasks: Number(g.totalTasks),
      completedTasks: Number(g.completedTasks),
    },
  }));

  if (goals.length === 0) {
    return (
      <div className='mt-16 text-center border-2 border-dashed rounded-lg p-12'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-50'>
          You have no goals yet
        </h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          Your journey to consistency begins with a single goal.
        </p>
        <div className='mt-6'>
          <CreateGoalButton />
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
}
