'use client';

import { Suspense, useState } from 'react';
import { GoalTree } from '@/components/goals/goal-tree';
import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { GoalCreationDialog } from '@/components/goals/goal-creation-dialog';
import { TaskList } from '@/components/tasks/task-list';
import { Skeleton } from '@/components/ui/skeleton';

// --- THE FIX: Define the type here as the single source of truth ---
export type GoalCreationOptions = {
  open: boolean;
  parentId?: string | null; // Allow null for top-level goals
};

export default function GoalsLayoutAndPage({
  params,
}: {
  params: { goalId?: string[] };
}) {
  const selectedGoalId = params.goalId?.[0] ?? null;
  const [dialogOptions, setDialogOptions] = useState<GoalCreationOptions>({
    open: false,
    parentId: null,
  });

  return (
    <>
      <div className='flex h-full border rounded-lg bg-card text-card-foreground'>
        <aside className='w-1/3 min-w-[280px] max-w-xs border-r'>
          <div className='p-4 flex items-center justify-between border-b'>
            <h2 className='text-lg font-semibold'>All Goals</h2>
            <CreateGoalButton
              onClick={() => setDialogOptions({ open: true, parentId: null })}
            />
          </div>
          <Suspense fallback={<GoalNavigatorSkeleton />}>
            <GoalTree
              activeGoalId={selectedGoalId}
              openCreationDialog={setDialogOptions}
            />
          </Suspense>
        </aside>
        <main className='flex-1'>
          {selectedGoalId ? (
            <TaskList goalId={selectedGoalId} />
          ) : (
            <div className='flex h-full flex-col items-center justify-center text-center p-8'>
              <h2 className='text-xl font-semibold'>Select a goal</h2>
              <p className='mt-2 text-muted-foreground'>
                Choose a goal from the list on the left to see its tasks.
              </p>
            </div>
          )}
        </main>
      </div>
      <GoalCreationDialog
        options={dialogOptions}
        onOpenChange={(open) => setDialogOptions({ ...dialogOptions, open })}
      />
    </>
  );
}

function GoalNavigatorSkeleton() {
  return (
    <div className='space-y-2 p-2'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='flex items-center gap-2 p-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 flex-1' />
        </div>
      ))}
    </div>
  );
}
