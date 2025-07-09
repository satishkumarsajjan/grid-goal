'use client';

import { PaceProgressChart } from '@/components/shared/pace-indicator-chart';
import { calculatePaceData } from '@/lib/pace-helpers';
import { type GoalWithSessions } from '@/lib/types';
import { TaskStats } from './task-stats';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
// NEW: Import the reusable tooltip component
import { InsightTooltip } from '../analytics/InsightTooltip';

interface TaskListHeaderProps {
  goal: GoalWithSessions;
  taskCount: number;
  completedTaskCount: number;
  inProgressTaskCount: number;
  isSavingOrder: boolean;
}

export function TaskListHeader({
  goal,
  taskCount,
  completedTaskCount,
  inProgressTaskCount,
  isSavingOrder,
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
    <div className='p-4 border-b'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>{goal.title}</h1>
        {isSavingOrder && (
          <div className='flex items-center gap-2 text-xs text-muted-foreground animate-pulse'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>Saving order...</span>
          </div>
        )}
      </div>

      {goal.description && (
        <p className='mt-1 text-sm text-muted-foreground'>{goal.description}</p>
      )}

      {/* This is the section we are modifying */}
      {paceData && paceData.length > 0 && (
        <div className='mt-4'>
          <div className='flex items-center mb-1 gap-2'>
            <InsightTooltip
              content={
                <>
                  <p className='font-medium'>
                    This chart helps you stay on track to meet your deadline.
                  </p>
                  <ul className='mt-2 list-disc list-inside space-y-1 text-xs'>
                    <li>
                      The <span className='font-semibold'>solid line</span> is
                      your actual cumulative progress.
                    </li>
                    <li>
                      The <span className='font-semibold '>dashed line</span> is
                      the ideal pace you need to maintain.
                    </li>
                  </ul>
                  <p className='mt-2'>
                    Try to keep your actual progress line at or above the target
                    line!
                  </p>
                </>
              }
            />
            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Pace Indicator
            </h3>
          </div>
          <PaceProgressChart data={paceData} />
        </div>
      )}
      <div className='mt-4'>
        <TaskStats {...taskStats} />
      </div>
    </div>
  );
}
