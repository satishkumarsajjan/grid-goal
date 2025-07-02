'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { GoalCard, GoalCardSkeleton } from '@/components/goals/goal-card';
import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { TaskList } from '@/components/tasks/task-list';
import { type GoalWithTasksCount } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { use } from 'react';

const fetchGoals = async (): Promise<GoalWithTasksCount[]> => {
  const { data } = await axios.get('/api/goals');
  return data;
};

export default function GoalsPage({
  params,
}: {
  params: Promise<{ goalId?: string[] }>;
}) {
  // Extract the selected goal ID from the URL. It will be null if at "/goals".
  const resolvedParams = use(params);
  const selectedGoalId = resolvedParams.goalId?.[0] ?? null;

  // This query fetches the list of all goals. It runs on both views.
  const {
    data: goals,
    isLoading: areGoalsLoading,
    isError: isGoalsError,
  } = useQuery<GoalWithTasksCount[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  // --- CONDITIONAL RENDERING LOGIC ---

  // Case 1: A specific goal is selected. Show the detailed TaskList view.
  if (selectedGoalId) {
    return (
      <div>
        <Button asChild variant='ghost' className='mb-4'>
          <Link href='/goals'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to All Goals
          </Link>
        </Button>
        {/* The TaskList component fetches its own data using the goalId */}
        <TaskList goalId={selectedGoalId} />
      </div>
    );
  }

  // Case 2: No goal is selected (we are at the "/goals" URL). Show the list of GoalCards.
  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50'>
          Your Goals
        </h1>
        <CreateGoalButton />
      </div>

      {areGoalsLoading && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <GoalCardSkeleton />
          <GoalCardSkeleton />
          <GoalCardSkeleton />
        </div>
      )}

      {isGoalsError && (
        <div className='rounded-md bg-red-50 p-4 text-center'>
          <p className='text-sm font-medium text-red-700'>
            Could not fetch goals.
          </p>
        </div>
      )}

      {goals && goals.length > 0 ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        !areGoalsLoading && (
          <div className='mt-8 text-center'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-50'>
              No goals yet
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Get started by creating your first goal.
            </p>
          </div>
        )
      )}
    </div>
  );
}
