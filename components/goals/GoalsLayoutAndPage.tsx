'use client';

import { Goal } from '@prisma/client';
import { Suspense, useState } from 'react';

import { CategoryForm } from '@/components/goals/CategoryForm';
import { GoalForm } from '@/components/goals/create-goal-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LayoutGrid } from 'lucide-react';

import { GoalContent } from '@/components/goals/GoalContent';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { TaskListSkeleton } from '@/components/tasks/task-list-skeleton';

export interface GoalDialogOptions {
  open: boolean;
  mode: 'create' | 'edit';
  parentId?: string | null;
  initialData?: Goal | null;
}

export default function GoalsLayoutAndPage({ goalId }: { goalId: string }) {
  const [goalDialogOptions, setGoalDialogOptions] = useState<GoalDialogOptions>(
    {
      open: false,
      mode: 'create',
      parentId: null,
      initialData: null,
    }
  );

  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  const handleOpenCreateGoalDialog = () => {
    setGoalDialogOptions({
      open: true,
      mode: 'create',
      parentId: null,
      initialData: null,
    });
  };

  return (
    <>
      <div className='h-full border rounded-lg overflow-hidden flex flex-col'>
        <div className='px-4 flex items-center justify-between border-b lg:hidden'>
          <MobileSidebar
            activeGoalId={goalId}
            openGoalDialog={setGoalDialogOptions}
            onOpenCreateGoal={handleOpenCreateGoalDialog}
          />
          <h2 className='text-lg font-semibold'>Goals</h2>

          <div className='w-8 h-8'></div>
        </div>

        <div className='flex flex-1 overflow-hidden'>
          <DesktopSidebar
            activeGoalId={goalId}
            openGoalDialog={setGoalDialogOptions}
            onOpenCreateGoal={handleOpenCreateGoalDialog}
          />

          <main className='flex-1 border-l'>
            {goalId ? (
              <Suspense fallback={<TaskListSkeleton />}>
                <GoalContent
                  goalId={goalId}
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

      <GoalDialog
        options={goalDialogOptions}
        onOpenChange={(open) =>
          setGoalDialogOptions({ ...goalDialogOptions, open })
        }
      />
      <Dialog
        open={isCreateCategoryOpen}
        onOpenChange={setIsCreateCategoryOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className='pt-4'>
            <CategoryForm onFinished={() => setIsCreateCategoryOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GoalDialog({
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
export function WelcomePlaceholder() {
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
