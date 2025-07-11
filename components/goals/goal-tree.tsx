'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { GoalNavigator } from '@/components/goals/goal-navigator';
import { type GoalDialogOptions } from '@/components/goals/goal-navigator-item'; // NEW: Import the generic dialog options type
import { buildGoalTree } from '@/lib/goal-helpers';
import { GoalWithProgress, GoalWithProgressAndChildren } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

// The props interface is updated to use the new generic type and name
interface GoalTreeProps {
  activeGoalId: string | null;
  openGoalDialog: (options: GoalDialogOptions) => void;
}

/**
 * A fetcher function for TanStack Query.
 */
const fetchGoals = async (): Promise<GoalWithProgress[]> => {
  const { data } = await axios.get('/api/goals/tree');
  return data;
};

/**
 * A Client Component that uses TanStack Query to fetch ALL goals for the user,
 * processes them into a tree, and then passes the result to the GoalNavigator.
 */
export function GoalTree({ activeGoalId, openGoalDialog }: GoalTreeProps) {
  const {
    data: allGoalsFlat,
    isLoading,
    isError,
    error,
  } = useQuery<GoalWithProgress[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  if (isLoading) {
    return <GoalNavigatorSkeleton />;
  }

  if (isError) {
    console.error('Failed to fetch goals:', error);
    return (
      <p className='p-4 text-sm text-destructive'>Failed to load goals.</p>
    );
  }

  // Process the fetched flat list into a hierarchical tree.
  const goalTree: GoalWithProgressAndChildren[] = allGoalsFlat
    ? buildGoalTree(allGoalsFlat)
    : [];

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

  // Render the GoalNavigator, passing the client-processed data and the new generic function.
  return (
    <GoalNavigator
      goalTree={goalTree}
      activeGoalId={activeGoalId}
      openGoalDialog={openGoalDialog}
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
