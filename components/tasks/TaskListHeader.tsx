'use client';

import { Category } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { PaceProgressChart } from '@/components/shared/pace-indicator-chart';
import { calculatePaceData } from '@/lib/pace-helpers';
import { type GoalWithSessions } from '@/lib/types';
import { InsightTooltip } from '../analytics/InsightTooltip';
import { GoalCategorySelector } from '../goals/GoalCategorySelector';
import { TaskStats } from './task-stats';

type GoalWithCategoryAndSessions = GoalWithSessions & {
  category: Category | null;
};

interface TaskListHeaderProps {
  goal: GoalWithCategoryAndSessions;
  taskCount: number;
  completedTaskCount: number;
  inProgressTaskCount: number;
  isSavingOrder: boolean;
  onOpenCreateCategoryDialog: () => void;
}

export function TaskListHeader({
  goal,
  taskCount,
  completedTaskCount,
  inProgressTaskCount,
  isSavingOrder,
  onOpenCreateCategoryDialog,
}: TaskListHeaderProps) {
  const paceData = useMemo(() => {
    if (goal.deadline && goal.deepEstimateTotalSeconds > 0) {
      return calculatePaceData(
        goal,
        goal.focusSessions,
        goal.deepEstimateTotalSeconds
      );
    }
    return null;
  }, [goal]);

  const taskStats = {
    total: taskCount,
    completed: completedTaskCount,
    inProgress: inProgressTaskCount,
    pending: taskCount - completedTaskCount - inProgressTaskCount,
  };

  return (
    <div
      className='p-6 border-b space-y-4'
      style={{ borderTop: `3px solid ${goal.color ?? 'transparent'}` }}
    >
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>{goal.title}</h1>
          {goal.description && (
            <p className='mt-1 text-sm text-muted-foreground max-w-prose'>
              {goal.description}
            </p>
          )}
        </div>
        {isSavingOrder && (
          <div className='flex items-center gap-2 text-xs text-muted-foreground animate-pulse flex-shrink-0 mt-1'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>Saving order...</span>
          </div>
        )}
      </div>

      <div className='flex items-center gap-6'>
        <TaskStats {...taskStats} />
        <GoalCategorySelector
          goal={goal}
          onOpenCreateCategoryDialog={onOpenCreateCategoryDialog}
        />
      </div>

      {paceData && paceData.length > 0 && (
        <div className='pt-2'>
          <div className='flex items-center mb-1 gap-2'>
            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Pace Indicator
            </h3>
            <InsightTooltip
              content={
                <div className='text-wrap'>
                  {' '}
                  <p className='font-medium'>
                    This chart helps you stay on track to meet your deadline.
                  </p>{' '}
                  <ul className='mt-2 list-disc list-inside space-y-1 text-xs'>
                    {' '}
                    <li>
                      The <span className='font-semibold'>solid line</span> is
                      your actual progress.
                    </li>{' '}
                    <li>
                      The <span className='font-semibold'>dashed line</span> is
                      your target pace.
                    </li>{' '}
                  </ul>{' '}
                </div>
              }
            />
          </div>
          <PaceProgressChart data={paceData} />
        </div>
      )}
    </div>
  );
}
