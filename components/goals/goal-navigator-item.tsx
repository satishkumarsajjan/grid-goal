'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { GoalStatus } from '@prisma/client';
import {
  ChevronRight,
  PlusCircle,
  MoreHorizontal,
  PauseCircle,
  Play,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { type GoalWithProgressAndChildren } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// --- API Function for the mutation ---
// This function will be called by the useMutation hook to update the goal's status.
const updateGoalStatus = async ({
  goalId,
  status,
}: {
  goalId: string;
  status: GoalStatus;
}) => {
  // Assuming you have an API route at /api/goals/[goalId] that accepts PATCH requests
  const { data } = await axios.patch(`/api/goals/${goalId}`, { status });
  return data;
};

// --- The props interface remains the same ---
interface GoalNavigatorItemProps {
  goal: GoalWithProgressAndChildren;
  activeGoalId: string | null;
  level: number;
  openCreationDialog: (options: {
    open: boolean;
    parentId?: string | null;
  }) => void;
}

export function GoalNavigatorItem({
  goal,
  activeGoalId,
  level,
  openCreationDialog,
}: GoalNavigatorItemProps) {
  const queryClient = useQueryClient();

  const isExpandedInitially = useMemo(() => {
    if (goal.id === activeGoalId) return true;
    const checkForActiveChild = (g: GoalWithProgressAndChildren): boolean => {
      if (g.id === activeGoalId) return true;
      return g.children.some(checkForActiveChild);
    };
    return checkForActiveChild(goal);
  }, [goal, activeGoalId]);

  const [isExpanded, setIsExpanded] = useState(isExpandedInitially);

  const hasChildren = goal.children.length > 0;
  const isActive = goal.id === activeGoalId;

  const totalTasks = goal.totalTasks;
  const completedTasks = goal.completedTasks;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // --- Mutation hook to handle all status changes ---
  const statusMutation = useMutation({
    mutationFn: updateGoalStatus,
    onSuccess: (data) => {
      toast.success(`Goal has been ${data.status.toLowerCase()}.`);
      // Invalidate the 'goals' query to refetch the entire tree with the new status
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast.error('Failed to update goal status.');
      console.error(error);
    },
  });

  // --- Handlers for menu actions ---
  const handleStatusUpdate = (e: React.MouseEvent, status: GoalStatus) => {
    e.stopPropagation();
    e.preventDefault();
    statusMutation.mutate({ goalId: goal.id, status });
  };

  const handleAddSubGoal = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openCreationDialog({ open: true, parentId: goal.id });
  };

  // --- Determine status properties for styling ---
  const isPaused = goal.status === 'PAUSED';
  const isArchived = goal.status === 'ARCHIVED';

  return (
    <div>
      <div
        className={cn(
          'group flex items-center justify-between rounded-md text-sm font-medium transition-colors w-full',
          isActive && !isArchived
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/50 hover:text-accent-foreground',
          (isPaused || isArchived) && 'text-muted-foreground',
          'pl-[calc(var(--indent-level)_*_1rem)]'
        )}
        style={{ '--indent-level': level } as React.CSSProperties}
      >
        <div className='flex items-center flex-1 truncate min-w-0'>
          {/* Expander Button or Status Icon */}
          <div className='flex h-7 w-7 items-center justify-center'>
            {isPaused ? (
              <PauseCircle className='h-4 w-4 text-yellow-500' />
            ) : isArchived ? (
              <Archive className='h-4 w-4' />
            ) : (
              <Button
                variant='ghost'
                size='icon'
                className={cn('h-7 w-7', !hasChildren && 'invisible')}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )}
                />
              </Button>
            )}
          </div>

          {/* Goal Link - Wraps Title and Progress Bar */}
          <Link
            href={`/goals/${goal.id}`}
            className='flex-1 truncate py-2 pr-2'
          >
            <span
              className={cn('block truncate', isArchived && 'line-through')}
            >
              {goal.title}
            </span>

            {totalTasks > 0 && !isArchived && (
              <div className='flex items-center gap-2 mt-1.5'>
                <Progress value={progress} className='h-1 flex-1' />
                <span className='text-xs text-muted-foreground font-mono'>
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Hover Actions Menu */}
        <div className='pr-2 opacity-0 group-hover:opacity-100 transition-opacity'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-7 w-7'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              onClick={(e) => e.stopPropagation()}
            >
              {!isArchived && !isPaused && (
                <DropdownMenuItem onClick={handleAddSubGoal}>
                  <PlusCircle className='mr-2 h-4 w-4' />
                  <span>Add Sub-Goal</span>
                </DropdownMenuItem>
              )}

              {!isArchived && <DropdownMenuSeparator />}

              {goal.status === 'ACTIVE' && (
                <DropdownMenuItem
                  onClick={(e) => handleStatusUpdate(e, GoalStatus.PAUSED)}
                >
                  <PauseCircle className='mr-2 h-4 w-4' />
                  <span>Pause Goal</span>
                </DropdownMenuItem>
              )}
              {goal.status === 'PAUSED' && (
                <DropdownMenuItem
                  onClick={(e) => handleStatusUpdate(e, GoalStatus.ACTIVE)}
                >
                  <Play className='mr-2 h-4 w-4' />
                  <span>Resume Goal</span>
                </DropdownMenuItem>
              )}

              {goal.status !== 'ARCHIVED' ? (
                <DropdownMenuItem
                  onClick={(e) => handleStatusUpdate(e, GoalStatus.ARCHIVED)}
                  className='focus:bg-destructive/80 focus:text-destructive-foreground'
                >
                  <Archive className='mr-2 h-4 w-4' />
                  <span>Archive Goal</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => handleStatusUpdate(e, GoalStatus.ACTIVE)}
                >
                  <ArchiveRestore className='mr-2 h-4 w-4' />
                  <span>Restore Goal</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Recursive Rendering of Children */}
      {hasChildren && isExpanded && !isArchived && (
        <div className='mt-1 space-y-1'>
          {goal.children.map((childGoal) => (
            <GoalNavigatorItem
              key={childGoal.id}
              goal={childGoal}
              activeGoalId={activeGoalId}
              level={level + 1}
              openCreationDialog={openCreationDialog}
            />
          ))}
        </div>
      )}
    </div>
  );
}
