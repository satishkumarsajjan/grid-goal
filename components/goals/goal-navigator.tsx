'use client';

import { type GoalWithChildren } from '@/lib/goal-helpers'; // Import our new type
import { GoalNavigatorItem } from './goal-navigator-item';

interface GoalNavigatorProps {
  goalTree: GoalWithChildren[];
  activeGoalId: string | null;
}

/**
 * The main container for the goal navigation tree.
 * It receives the pre-processed goal tree from a Server Component
 * and renders the first level of goals.
 */
export function GoalNavigator({ goalTree, activeGoalId }: GoalNavigatorProps) {
  return (
    <nav className='flex-1 space-y-1 p-2'>
      {goalTree.map((goal) => (
        // The heavy lifting is delegated to the recursive item component.
        <GoalNavigatorItem
          key={goal.id}
          goal={goal}
          activeGoalId={activeGoalId}
          level={0} // Top-level goals start at level 0 for indentation
        />
      ))}
    </nav>
  );
}
