'use client'; // This page is now a client component

import { GoalNavigator } from '@/components/goals/goal-navigator';
import { TaskList } from '@/components/tasks/task-list';

export default function GoalsPage({
  params,
}: {
  params: { goalId?: string[] };
}) {
  const selectedGoalId = params.goalId?.[0] ?? null;

  // The page now only sets up the structure.
  // The child components will fetch their own data.
  return (
    <div className='flex h-full'>
      <GoalNavigator activeGoalId={selectedGoalId} />
      <div className='flex-1 flex flex-col'>
        <TaskList goalId={selectedGoalId} key={selectedGoalId} />
      </div>
    </div>
  );
}
