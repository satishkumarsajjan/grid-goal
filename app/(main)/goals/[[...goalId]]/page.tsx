'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GoalTree } from '@/components/goals/goal-tree';
import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { GoalCreationDialog } from '@/components/goals/goal-creation-dialog';
import { TaskList } from '@/components/tasks/task-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GoalCreationOptions = {
  open: boolean;
  parentId?: string | null;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile sidebar when the user navigates to a new goal
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      <div className='h-full bg-card border rounded-lg overflow-hidden flex flex-col'>
        {/* --- Mobile-Only Header --- */}
        <div className='px-4 py-2 flex items-center justify-between border-b md:hidden'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className='h-5 w-5' />
            <span className='sr-only'>Open Goals Menu</span>
          </Button>
          <h2 className='text-lg font-semibold'>Goals</h2>
          <CreateGoalButton
            onClick={() => setDialogOptions({ open: true, parentId: null })}
          />
        </div>

        <div className='flex flex-1 overflow-hidden'>
          {/* --- Sidebar (with responsive classes) --- */}
          <aside
            className={cn(
              // Mobile styles: hidden, absolute overlay
              'fixed inset-y-0 left-0 z-30 h-full w-full max-w-sm flex-col bg-muted/95 backdrop-blur-sm transition-transform duration-300 ease-in-out md:static md:w-1/3 md:max-w-sm md:flex md:translate-x-0 md:bg-muted/50 md:backdrop-blur-none',
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {/* Sidebar Header (visible on both mobile drawer and desktop) */}
            <div className='px-4 py-3 flex items-center justify-between border-b'>
              <h2 className='text-lg font-semibold'>All Goals</h2>
              <div className='flex items-center gap-2'>
                <div className='hidden md:block'>
                  <CreateGoalButton
                    onClick={() =>
                      setDialogOptions({ open: true, parentId: null })
                    }
                  />
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='md:hidden'
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>Close Menu</span>
                </Button>
              </div>
            </div>

            {/* Scrollable container for the goal list */}
            <div className='flex-1 overflow-y-auto p-2'>
              <Suspense fallback={<GoalNavigatorSkeleton />}>
                <GoalTree
                  activeGoalId={selectedGoalId}
                  openCreationDialog={setDialogOptions}
                />
              </Suspense>
            </div>
          </aside>
          {/* Overlay to close sidebar on mobile */}
          {isSidebarOpen && (
            <div
              className='fixed inset-0 z-20 bg-black/20 md:hidden'
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* --- Main content area --- */}
          <main className='flex-1 border-l'>
            {selectedGoalId ? (
              <Suspense fallback={<TaskListSkeleton />}>
                <TaskList goalId={selectedGoalId} />
              </Suspense>
            ) : (
              <WelcomePlaceholder />
            )}
          </main>
        </div>
      </div>

      <GoalCreationDialog
        options={dialogOptions}
        onOpenChange={(open) => setDialogOptions({ ...dialogOptions, open })}
      />
    </>
  );
}

// --- Helper components (skeletons, placeholder) remain the same ---

function WelcomePlaceholder() {
  return (
    <div className='flex h-full flex-col items-center justify-center text-center p-8 gap-4'>
      <LayoutGrid className='h-16 w-16 text-muted-foreground/40' />
      <h2 className='text-2xl font-bold'>Welcome to Your Goals</h2>
      <p className='max-w-xs text-muted-foreground'>
        Select a goal from the left to view its tasks, or create a new one to
        get started.
      </p>
    </div>
  );
}

function GoalNavigatorSkeleton() {
  return (
    <div className='space-y-3 p-2'>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 p-1',
            i > 1 && i < 5 && 'ml-6',
            i === 4 && '!ml-12'
          )}
        >
          <Skeleton className='h-5 w-5 rounded-md' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-2 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div className='p-6 space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-1/2' />
        <Skeleton className='h-4 w-3/4' />
      </div>
      <div className='space-y-3 pt-4'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='flex items-center gap-3'>
            <Skeleton className='h-5 w-5 rounded-sm' />
            <Skeleton className='h-5 flex-1' />
          </div>
        ))}
      </div>
    </div>
  );
}
