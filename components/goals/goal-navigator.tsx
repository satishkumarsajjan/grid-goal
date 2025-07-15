'use client';

import { type GoalWithProgressAndChildren } from '@/lib/types';
import {
  GoalNavigatorItem,
  type GoalDialogOptions,
} from './goal-navigator-item';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <ScrollArea className='h-full'>
      <nav className='space-y-1 p-2'>
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
    </ScrollArea>
  );
}
