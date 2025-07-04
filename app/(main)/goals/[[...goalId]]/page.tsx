'use client'; // <-- IMPORTANT: This page now manages state.

import { Suspense, useState } from 'react';

// The data-fetching part is now moved to a child Server Component.

import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { GoalCreationDialog } from '@/components/goals/goal-creation-dialog';
import { GoalTree } from '@/components/goals/goal-tree';
import { TaskList } from '@/components/tasks/task-list';
import { Skeleton } from '@/components/ui/skeleton';

// This type definition might be needed by child components
export type GoalCreationOptions = {
  open: boolean;
  parentId?: string;
};

/**
 * This is now a CLIENT component that orchestrates the layout and manages
 * the state for the 'Create Goal' dialog.
 */
export default function GoalsLayoutAndPage({
  params,
}: {
  params: { goalId?: string[] };
}) {
  const selectedGoalId = params.goalId?.[0] ?? null;

  // State for controlling the dialog is managed here, at the highest level.
  const [dialogOptions, setDialogOptions] = useState<GoalCreationOptions>({
    open: false,
    parentId: undefined,
  });

  return (
    <>
      <div className='flex h-full border rounded-lg bg-card text-card-foreground'>
        {/* --- LEFT PANE: The Goal Navigator --- */}
        <aside className='w-1/3 min-w-[280px] max-w-xs border-r'>
          <div className='p-4 flex items-center justify-between border-b'>
            <h2 className='text-lg font-semibold'>All Goals</h2>
            {/* This button now gets a function to open the dialog for a top-level goal */}
            <CreateGoalButton
              onClick={() =>
                setDialogOptions({ open: true, parentId: undefined })
              }
            />
          </div>

          {/* We pass the 'openCreationDialog' function down to the tree */}
          <GoalTree
            activeGoalId={selectedGoalId}
            openCreationDialog={setDialogOptions}
          />
        </aside>

        {/* --- RIGHT PANE: The Task List or an Empty State --- */}
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

      {/* The Dialog is rendered here, controlled by this page's state */}
      <GoalCreationDialog
        options={dialogOptions}
        onOpenChange={(open) => setDialogOptions({ ...dialogOptions, open })}
      />
    </>
  );
}

/**
 * A helper component for rendering the loading state for the navigator.
 */
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
