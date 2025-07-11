'use client';

import {
  GoalNavigatorItem,
  type GoalDialogOptions,
} from './goal-navigator-item'; // NEW: Import the generic dialog options type
import { type GoalWithProgressAndChildren } from '@/lib/types';

// The props interface is updated to be more generic.
interface GoalNavigatorProps {
  goalTree: GoalWithProgressAndChildren[];
  activeGoalId: string | null;
  // RENAMED and RE-TYPED: This now handles opening the dialog for creating OR editing.
  openGoalDialog: (options: GoalDialogOptions) => void;
}

export function GoalNavigator({
  goalTree,
  activeGoalId,
  openGoalDialog, // Use the new, more generic prop name
}: GoalNavigatorProps) {
  return (
    <nav className='flex-1 space-y-1 p-2 overflow-x-auto'>
      {goalTree.map((goal) => (
        <GoalNavigatorItem
          key={goal.id}
          goal={goal}
          activeGoalId={activeGoalId}
          level={0}
          // Pass the generic dialog handler down to the item
          openGoalDialog={openGoalDialog}
        />
      ))}
    </nav>
  );
}
