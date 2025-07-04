import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { type Goal } from '@prisma/client';

import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { buildGoalTree } from '@/lib/goal-helpers'; // Our new server-side helper
import { GoalNavigator } from '@/components/goals/goal-navigator'; // The new navigator component
import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { TaskList } from '@/components/tasks/task-list';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * This is the main async Server Component for the entire /goals route.
 * It now renders a two-pane "Master-Detail" layout.
 */
export default async function GoalsLayoutAndPage({
  params,
}: {
  params: { goalId?: string[] };
}) {
  const selectedGoalId = params.goalId?.[0] ?? null;

  return (
    <div className='flex h-full border rounded-lg bg-card text-card-foreground'>
      {/* --- LEFT PANE: The Goal Navigator --- */}
      <aside className='w-1/3 min-w-[280px] max-w-xs border-r'>
        <div className='p-4 flex items-center justify-between border-b'>
          <h2 className='text-lg font-semibold'>All Goals</h2>
          <CreateGoalButton />
        </div>
        {/* Use Suspense for a great loading experience for the navigator */}
        <Suspense fallback={<GoalNavigatorSkeleton />}>
          <GoalTree activeGoalId={selectedGoalId} />
        </Suspense>
      </aside>

      {/* --- RIGHT PANE: The Task List or an Empty State --- */}
      <main className='flex-1'>
        {selectedGoalId ? (
          // If a goal is selected, show its task list.
          <TaskList goalId={selectedGoalId} />
        ) : (
          // If no goal is selected, show a helpful empty state.
          <div className='flex h-full flex-col items-center justify-center text-center p-8'>
            <h2 className='text-xl font-semibold'>Select a goal</h2>
            <p className='mt-2 text-muted-foreground'>
              Choose a goal from the list on the left to see its tasks.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * A helper component to render the loading skeleton for the navigator.
 */
function GoalNavigatorSkeleton() {
  return (
    <div className='space-y-2 p-2'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='flex items-center gap-2 p-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 flex-1' />
        </div>
      ))}
    </div>
  );
}

/**
 * An async Server Component dedicated to fetching ALL goals for the user
 * and passing the processed tree structure to the GoalNavigator client component.
 */
async function GoalTree({ activeGoalId }: { activeGoalId: string | null }) {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className='p-4 text-sm text-muted-foreground'>Not signed in.</p>;
  }

  // 1. Fetch all goals for the user as a flat list.
  const allGoalsFlat = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  // 2. Use our server-side helper to build the nested tree.
  const goalTree = buildGoalTree(allGoalsFlat);

  if (goalTree.length === 0) {
    return (
      <div className='mt-8 text-center p-4'>
        <h3 className='text-sm font-medium'>No goals yet</h3>
        <p className='mt-1 text-xs text-muted-foreground'>
          Create your first goal to begin.
        </p>
      </div>
    );
  }

  // 3. Render the GoalNavigator, which is a client component that handles interactivity.
  return <GoalNavigator goalTree={goalTree} activeGoalId={activeGoalId} />;
}
