'use client';

import axios from 'axios'; // Using axios for fetch requests is common and convenient
import Link from 'next/link';

import { cn } from '@/lib/utils'; // A utility for combining class names
import { useQuery } from '@tanstack/react-query';
import { CreateGoalButton } from './create-goal-button'; // We will create this
import { GoalWithTasksCount } from '@/lib/types';

// Define the type for the props, including the task count from the server
interface GoalNavigatorProps {
  activeGoalId: string | null;
}

const fetchGoals = async (): Promise<GoalWithTasksCount[]> => {
  const { data } = await axios.get<GoalWithTasksCount[]>('/api/goals');
  return data;
};

export function GoalNavigator({ activeGoalId }: GoalNavigatorProps) {
  const {
    data: goals,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  if (isLoading) {
    return <div>Loading goals...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <aside className='hidden w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:flex'>
      <CreateGoalButton />

      <nav className='p-2'>
        {goals?.map((goal) => {
          const isActive = activeGoalId === goal.id;

          return (
            <Link
              key={goal.id}
              href={`/goals/${goal.id}`}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                isActive
                  ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300'
              )}
            >
              <span className='flex-1 truncate'>{goal.title}</span>
              <span className='text-xs text-gray-400 dark:text-gray-500'>
                {goal._count.tasks}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
