'use client';

import { GoalNavigatorItem } from './goal-navigator-item';
import { type GoalWithChildren } from '@/lib/goal-helpers';
import { type GoalCreationOptions } from '@/app/(main)/goals/[[...goalId]]/page';

interface GoalNavigatorProps {
  goalTree: GoalWithChildren[];
  activeGoalId: string | null;
  openCreationDialog: (options: GoalCreationOptions) => void;
}

export function GoalNavigator({
  goalTree,
  activeGoalId,
  openCreationDialog,
}: GoalNavigatorProps) {
  return (
    <nav className='flex-1 space-y-1 p-2'>
      {goalTree.map((goal) => (
        <GoalNavigatorItem
          key={goal.id}
          goal={goal}
          activeGoalId={activeGoalId}
          level={0}
          openCreationDialog={openCreationDialog}
        />
      ))}
    </nav>
  );
}
