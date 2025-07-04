'use client'; // <-- IMPORTANT: This is now a client component.

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type Goal } from '@prisma/client';

import { buildGoalTree } from '@/lib/goal-helpers';
import { GoalNavigator } from '@/components/goals/goal-navigator';
import { type GoalCreationOptions } from '@/app/(main)/goals/[[...goalId]]/page';
import { Skeleton } from '../ui/skeleton';

interface GoalTreeProps {
  activeGoalId: string | null;
  openCreationDialog: (options: GoalCreationOptions) => void;
}

/**
 * A fetcher function for TanStack Query.
 * It calls our new API endpoint to get the flat list of goals.
 */
const fetchGoals = async (): Promise<Goal[]> => {
  const { data } = await axios.get('/api/goals/tree');
  return data;
};

/**
 * A Client Component that uses TanStack Query to fetch ALL goals for the user,
 * processes them into a tree, and then passes the result to the GoalNavigator.
 */
export function GoalTree({ activeGoalId, openCreationDialog }: GoalTreeProps) {
  const {
    data: allGoalsFlat,
    isLoading,
    isError,
    error,
  } = useQuery<Goal[]>({
    queryKey: ['goals'], // This query key will be used for caching and invalidation.
    queryFn: fetchGoals,
  });

  // --- Render Logic based on query state ---

  if (isLoading) {
    // Use the skeleton loader while the initial fetch is in progress.
    return <GoalNavigatorSkeleton />;
  }

  if (isError) {
    console.error('Failed to fetch goals:', error);
    return (
      <p className='p-4 text-sm text-destructive'>Failed to load goals.</p>
    );
  }

  // If data is available, process it into a tree.
  const goalTree = allGoalsFlat ? buildGoalTree(allGoalsFlat) : [];

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

  // Render the GoalNavigator, passing the client-processed data and the function.
  return (
    <GoalNavigator
      goalTree={goalTree}
      activeGoalId={activeGoalId}
      openCreationDialog={openCreationDialog}
    />
  );
}

/**
 * A dedicated skeleton component for the navigator loading state.
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
