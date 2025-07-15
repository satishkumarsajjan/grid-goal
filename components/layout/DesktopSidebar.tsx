'use client';

import { Suspense } from 'react';

import { type GoalDialogOptions } from '@/app/(main)/goals/[[...goalId]]/page';
import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { DeleteCategoriesButton } from '@/components/goals/DeleteCategoriesButton';
import { GoalTree } from '@/components/goals/goal-tree';
import { GoalNavigatorSkeleton } from './MobileSidebar';

interface DesktopSidebarProps {
  activeGoalId: string | null;
  openGoalDialog: (options: GoalDialogOptions) => void;
  onOpenCreateGoal: () => void;
}

export function DesktopSidebar({
  activeGoalId,
  openGoalDialog,
  onOpenCreateGoal,
}: DesktopSidebarProps) {
  return (
    <aside className='hidden lg:flex w-1/3 max-w-sm flex-col border-r bg-muted/50'>
      <div className='px-4 py-3 flex items-center justify-between border-b'>
        <h2 className='text-lg font-semibold'>All Goals</h2>
        <CreateGoalButton onClick={onOpenCreateGoal} />
      </div>
      <div className='flex-1 overflow-y-auto p-2'>
        <Suspense fallback={<GoalNavigatorSkeleton />}>
          <GoalTree
            activeGoalId={activeGoalId}
            openGoalDialog={openGoalDialog}
          />
        </Suspense>
      </div>
      <div className='p-2 border-t bg-background'>
        <DeleteCategoriesButton />
      </div>
    </aside>
  );
}
