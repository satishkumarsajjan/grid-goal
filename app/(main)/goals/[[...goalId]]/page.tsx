'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Goal } from '@prisma/client';

import { GoalTree } from '@/components/goals/goal-tree';
import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { TaskList } from '@/components/tasks/task-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteCategoriesButton } from '@/components/goals/DeleteCategoriesButton';
import { GoalForm } from '@/components/goals/create-goal-form';
// NEW: Import the CreateCategoryForm
import { CreateCategoryForm } from '@/components/goals/CreateCategoryForm';

export interface GoalDialogOptions {
  open: boolean;
  mode: 'create' | 'edit';
  parentId?: string | null;
  initialData?: Goal | null;
}

export default function GoalsLayoutAndPage({
  params,
}: {
  params: { goalId?: string[] };
}) {
  const selectedGoalId = params.goalId?.[0] ?? null;
  const [goalDialogOptions, setGoalDialogOptions] = useState<GoalDialogOptions>(
    { open: false, mode: 'create', parentId: null, initialData: null }
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // NEW: State to control the separate "Create Category" dialog
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      <div className='h-full bg-card border rounded-lg overflow-hidden flex flex-col'>
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
            onClick={() => setGoalDialogOptions({ open: true, mode: 'create' })}
          />
        </div>
        <div className='flex flex-1 overflow-hidden'>
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-30 h-full w-full max-w-sm flex-col bg-muted/95 backdrop-blur-sm transition-transform duration-300 ease-in-out md:static md:w-1/3 md:max-w-sm md:flex md:translate-x-0 md:bg-muted/50 md:backdrop-blur-none',
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className='px-4 py-3 flex items-center justify-between border-b'>
              <h2 className='text-lg font-semibold'>All Goals</h2>
              <div className='flex items-center gap-2'>
                <div className='hidden md:block'>
                  <CreateGoalButton
                    onClick={() =>
                      setGoalDialogOptions({ open: true, mode: 'create' })
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
            <div className='flex-1 overflow-y-auto p-2'>
              <Suspense fallback={<GoalNavigatorSkeleton />}>
                <GoalTree
                  activeGoalId={selectedGoalId}
                  openGoalDialog={setGoalDialogOptions}
                />
              </Suspense>
            </div>
            <div className='p-2 border-t'>
              <DeleteCategoriesButton />
            </div>
          </aside>
          {isSidebarOpen && (
            <div
              className='fixed inset-0 z-20 bg-black/20 md:hidden'
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <main className='flex-1 border-l'>
            {selectedGoalId ? (
              <Suspense fallback={<TaskListSkeleton />}>
                {/* --- THIS IS THE FIX --- */}
                {/* Pass the required function down to the TaskList component */}
                <TaskList
                  goalId={selectedGoalId}
                  onOpenCreateCategoryDialog={() =>
                    setIsCreateCategoryOpen(true)
                  }
                />
              </Suspense>
            ) : (
              <WelcomePlaceholder />
            )}
          </main>
        </div>
      </div>

      {/* This dialog is for creating/editing GOALS */}
      <GoalDialog
        options={goalDialogOptions}
        onOpenChange={(open) =>
          setGoalDialogOptions({ ...goalDialogOptions, open })
        }
      />

      {/* NEW: This dialog is for creating CATEGORIES */}
      <Dialog
        open={isCreateCategoryOpen}
        onOpenChange={setIsCreateCategoryOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className='pt-4'>
            <CreateCategoryForm
              onFinished={() => setIsCreateCategoryOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GoalDialog({
  options,
  onOpenChange,
}: {
  options: GoalDialogOptions;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = options.mode === 'edit';
  const title = isEditing ? 'Edit Goal' : 'Create a New Goal';
  const description = isEditing
    ? `You are editing "${options.initialData?.title}".`
    : 'Set a new objective to work towards.';
  if (!options.open) return null;
  return (
    <Dialog open={options.open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </DialogHeader>
        <div className='pt-4'>
          <GoalForm
            initialData={options.initialData}
            parentId={options.parentId}
            onFinished={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
function WelcomePlaceholder() {
  return (
    <div className='flex h-full flex-col items-center justify-center text-center p-8 gap-4'>
      {' '}
      <LayoutGrid className='h-16 w-16 text-muted-foreground/40' />{' '}
      <h2 className='text-2xl font-bold'>Welcome to Your Goals</h2>{' '}
      <p className='max-w-xs text-muted-foreground'>
        {' '}
        Select a goal from the left to view its tasks, or create a new one to
        get started.{' '}
      </p>{' '}
    </div>
  );
}
function GoalNavigatorSkeleton() {
  return (
    <div className='space-y-3 p-2'>
      {' '}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 p-1',
            i > 1 && i < 5 && 'ml-6',
            i === 4 && '!ml-12'
          )}
        >
          {' '}
          <Skeleton className='h-5 w-5 rounded-md' />{' '}
          <div className='flex-1 space-y-1.5'>
            {' '}
            <Skeleton className='h-4 w-3/4' />{' '}
            <Skeleton className='h-2 w-1/2' />{' '}
          </div>{' '}
        </div>
      ))}{' '}
    </div>
  );
}
export function TaskListSkeleton() {
  return (
    <div className='p-6 space-y-4'>
      {' '}
      <div className='space-y-2'>
        {' '}
        <Skeleton className='h-8 w-1/2' /> <Skeleton className='h-4 w-3/4' />{' '}
      </div>{' '}
      <div className='space-y-3 pt-4'>
        {' '}
        {[...Array(5)].map((_, i) => (
          <div key={i} className='flex items-center gap-3'>
            {' '}
            <Skeleton className='h-5 w-5 rounded-sm' />{' '}
            <Skeleton className='h-5 flex-1' />{' '}
          </div>
        ))}{' '}
      </div>{' '}
    </div>
  );
}
