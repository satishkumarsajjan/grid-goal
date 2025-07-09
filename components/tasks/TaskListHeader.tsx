// components/goal/TaskListHeader.tsx
'use client';

import { PaceProgressChart } from '@/components/shared/pace-indicator-chart';
import { calculatePaceData } from '@/lib/pace-helpers';
import { type GoalWithSessions } from '@/lib/types';
import { TaskStats } from './task-stats';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react'; // Import a spinner icon

interface TaskListHeaderProps {
  goal: GoalWithSessions;
  taskCount: number;
  completedTaskCount: number;
  inProgressTaskCount: number;
  isSavingOrder: boolean; // NEW PROP
}

export function TaskListHeader({
  goal,
  taskCount,
  completedTaskCount,
  inProgressTaskCount,
  isSavingOrder, // NEW PROP
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
        {/* NEW: Saving indicator appears when a reorder is in progress */}
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
      {paceData && paceData.length > 0 && (
        <div className='mt-4'>
          <h3 className='text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider'>
            Pace
          </h3>
          <PaceProgressChart data={paceData} />
        </div>
      )}
      <div className='mt-4'>
        <TaskStats {...taskStats} />
      </div>
    </div>
  );
}
