'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type Goal } from '@prisma/client';

import { TaskList } from '@/components/tasks/task-list';
import { ArchivedGoalSummary } from './ArchivedGoalSummary';
import { TaskListSkeleton } from '@/app/(main)/goals/[[...goalId]]/page';

// This fetcher gets just the core goal object, including its status
const fetchCoreGoal = async (goalId: string): Promise<Goal> => {
  const { data } = await axios.get(`/api/goals/${goalId}`);
  return data;
};

interface GoalContentProps {
  goalId: string;
  onOpenCreateCategoryDialog: () => void;
}

export function GoalContent({
  goalId,
  onOpenCreateCategoryDialog,
}: GoalContentProps) {
  const {
    data: goal,
    isLoading,
    isError,
  } = useQuery<Goal>({
    queryKey: ['coreGoal', goalId],
    queryFn: () => fetchCoreGoal(goalId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (isError || !goal) {
    return <p className='text-destructive p-6'>Error loading goal.</p>;
  }

  // --- THIS IS THE DECISION LOGIC ---
  if (goal.status === 'ARCHIVED') {
    return <ArchivedGoalSummary goalId={goal.id} />;
  } else {
    return (
      <TaskList
        goalId={goal.id}
        onOpenCreateCategoryDialog={onOpenCreateCategoryDialog}
      />
    );
  }
}
