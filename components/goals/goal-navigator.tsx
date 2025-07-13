'use client';

import { type GoalWithProgressAndChildren } from '@/lib/types';
import {
  GoalNavigatorItem,
  type GoalDialogOptions,
} from './goal-navigator-item';

interface GoalNavigatorProps {
  goalTree: GoalWithProgressAndChildren[];
  activeGoalId: string | null;

  openGoalDialog: (options: GoalDialogOptions) => void;
}

export function GoalNavigator({
  goalTree,
  activeGoalId,
  openGoalDialog,
}: GoalNavigatorProps) {
  return (
    <nav className='flex-1 space-y-1 p-2 overflow-x-auto'>
      {goalTree.map((goal) => (
        <GoalNavigatorItem
          key={goal.id}
          goal={goal}
          activeGoalId={activeGoalId}
          level={0}
          openGoalDialog={openGoalDialog}
        />
      ))}
    </nav>
  );
}
