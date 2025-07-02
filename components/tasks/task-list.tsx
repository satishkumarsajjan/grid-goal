'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type Task } from '@prisma/client';
import { TaskItem } from './task-item';
import { CreateTaskForm } from './create-task-form';
import { GoalWithTasksCount } from '@/lib/types';

// Props now only require the goalId
interface TaskListProps {
  goalId: string | null;
}

// NEW: A fetcher for a single goal's details
const fetchGoalDetails = async (
  goalId: string
): Promise<GoalWithTasksCount> => {
  // We need a new API endpoint for this. Let's assume it's GET /api/goals/[goalId]
  const { data } = await axios.get(`/api/goals/${goalId}`);
  return data;
};

// The existing fetcher for tasks
const fetchTasksByGoal = async (goalId: string): Promise<Task[]> => {
  const { data } = await axios.get(`/api/goals/${goalId}/tasks`);
  return data;
};

export function TaskList({ goalId }: TaskListProps) {
  // Query 1: Fetch the details of the selected goal
  const {
    data: goal,
    isLoading: isGoalLoading,
    isError: isGoalError,
  } = useQuery<GoalWithTasksCount>({
    queryKey: ['goal', goalId], // Dynamic key for the specific goal
    queryFn: () => fetchGoalDetails(goalId!),
    enabled: !!goalId, // Only run if goalId exists
  });

  // Query 2: Fetch the tasks for the selected goal
  const {
    data: tasks,
    isLoading: areTasksLoading,
    isError: areTasksError,
  } = useQuery<Task[]>({
    queryKey: ['tasks', goalId],
    queryFn: () => fetchTasksByGoal(goalId!),
    enabled: !!goalId,
  });

  // Handle the initial state where no goal is selected
  if (!goalId) {
    return (
      <div className='flex h-full flex-col items-center justify-center bg-gray-50 text-center dark:bg-gray-800/20'>
        <h2 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
          Select a goal
        </h2>
        <p className='text-gray-500 dark:text-gray-400'>
          Choose a goal from the list to see its tasks.
        </p>
      </div>
    );
  }

  // Handle loading and error states for both queries
  if (isGoalLoading || areTasksLoading) {
    return <div>Loading...</div>; // Or a more detailed skeleton loader
  }

  if (isGoalError || areTasksError) {
    return <div className='text-red-500'>Error loading goal data.</div>;
  }

  // If we have a goalId but the fetch returned no goal (e.g., deleted), handle it
  if (!goal) {
    return <div>Goal not found.</div>;
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header Section - Now uses data from its own query */}
      <div className='border-b border-gray-200 p-4 dark:border-gray-700'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-50'>
          {goal.title}
        </h1>
        {goal.description && (
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
            {goal.description}
          </p>
        )}
      </div>

      {/* Task List Section */}
      <div className='flex-1 overflow-y-auto p-4'>
        {tasks && tasks.map((task) => <TaskItem key={task.id} task={task} />)}
      </div>

      {/* Footer Section for adding new tasks */}
      <div className='border-t border-gray-200 p-4 dark:border-gray-700'>
        <CreateTaskForm goalId={goal.id} />
      </div>
    </div>
  );
}
