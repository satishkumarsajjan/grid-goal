'use client';

import { CreateGoalButton } from '@/components/goals/create-goal-button';
import { DeleteCategoriesButton } from '@/components/goals/DeleteCategoriesButton';
import { GoalTree } from '@/components/goals/goal-tree';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '../ui/skeleton';
import { GoalDialogOptions } from '../goals/goal-navigator-item';

interface MobileSidebarProps {
  activeGoalId: string | null;
  openGoalDialog: (options: GoalDialogOptions) => void;
  onOpenCreateGoal: () => void;
}

export function GoalNavigatorSkeleton() {
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

export function MobileSidebar({
  activeGoalId,
  openGoalDialog,
  onOpenCreateGoal,
}: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Menu className='h-5 w-5' />
          <span className='sr-only'>Open Goals Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='p-0 w-full max-w-sm flex flex-col'>
        <SheetHeader className='p-4 border-b'>
          <div className='flex items-center justify-between'>
            <SheetTitle>All Goals</SheetTitle>
            <CreateGoalButton onClick={onOpenCreateGoal} />
          </div>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto'>
          <Suspense fallback={<GoalNavigatorSkeleton />}>
            <GoalTree
              activeGoalId={activeGoalId}
              openGoalDialog={openGoalDialog}
            />
          </Suspense>
        </div>
        <div className='p-2 border-t mt-auto bg-background'>
          <DeleteCategoriesButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
