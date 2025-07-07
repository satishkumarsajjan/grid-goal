// src/components/goals/GoalNavigatorItem.tsx

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
  CheckCircle2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { type GoalWithProgressAndChildren } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DeadlineBadge } from './deadline-badge';

const INDENT_SIZE_REM = 1.25;

const updateGoalStatus = async ({
  goalId,
  status,
}: {
  goalId: string;
  status: GoalStatus;
}) => {
  const { data } = await axios.patch(`/api/goals/${goalId}`, { status });
  return data;
};

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
  const isPaused = goal.status === 'PAUSED';
  const isArchived = goal.status === 'ARCHIVED';

  const statusMutation = useMutation({
    mutationFn: updateGoalStatus,
    onSuccess: (data) => {
      toast.success(`Goal status updated to ${data.status.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast.error('Failed to update goal status.');
      console.error(error);
    },
  });

  const handleStatusUpdate = (status: GoalStatus) => {
    statusMutation.mutate({ goalId: goal.id, status });
  };

  const handleAddSubGoal = () => {
    openCreationDialog({ open: true, parentId: goal.id });
  };

  return (
    <div
      className='relative'
      style={{ paddingLeft: `${level * INDENT_SIZE_REM}rem` }}
    >
      <div
        className={cn(
          // --- CHANGED ---: Added pl-4 to make space for the color bar
          'group relative rounded-md w-full transition-colors py-1 pr-2 pl-4',
          isActive && !isArchived
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/60',
          (isPaused || isArchived) && 'text-muted-foreground opacity-75'
        )}
      >
        {/* --- CHANGED: Added Color Accent Bar --- */}
        {/* This bar is positioned absolutely within the padded space */}
        <div
          className='absolute left-0 top-0 h-full w-1 rounded-l-md'
          style={{ backgroundColor: goal.color || 'transparent' }}
        />

        {/* --- ROW 1: Icon, Title, and Actions --- */}
        <div className='flex h-8 items-center gap-2 w-full'>
          {/* Expander / Status Icon */}
          <div className='flex h-full w-8 items-center justify-center flex-shrink-0'>
            <GoalStatusIcon
              hasChildren={hasChildren}
              isExpanded={isExpanded}
              isPaused={isPaused}
              isArchived={isArchived}
              onToggle={() => setIsExpanded(!isExpanded)}
            />
          </div>

          {/* Title Link (Takes up all available space) */}
          <Link
            href={`/goals/${goal.id}`}
            // --- CHANGED ---: Removed gap-2.5 as the color dot is gone.
            className='flex-1 min-w-0 flex items-center'
          >
            {/* --- CHANGED ---: Removed the small color dot span */}
            <span
              className={cn(
                'truncate font-medium text-sm',
                isArchived && 'line-through'
              )}
            >
              {goal.title}
            </span>
          </Link>

          {/* Actions Menu */}
          <div className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'>
            <GoalActionsMenu
              goal={goal}
              onStatusUpdate={handleStatusUpdate}
              onAddSubGoal={handleAddSubGoal}
            />
          </div>
        </div>

        {/* --- ROW 2: Metadata (Indented) --- */}
        {/* --- CHANGED ---: Adjusted indentation from pl-9 to pl-10 to align with title */}
        {!isArchived && (goal.deadline || goal.totalTasks > 0) && (
          <div className='pl-10 flex items-center gap-4 text-xs mt-0.5'>
            {goal.totalTasks > 0 && (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1.5 text-muted-foreground'>
                    <CheckCircle2 className='h-3.5 w-3.5' />
                    <span className='font-mono'>
                      {goal.completedTasks}/{goal.totalTasks}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Tasks Completed</TooltipContent>
              </Tooltip>
            )}
            {goal.deadline && <DeadlineBadge deadline={goal.deadline} />}
          </div>
        )}
      </div>

      {/* --- Recursive Children Rendering --- */}
      {hasChildren && isExpanded && !isArchived && (
        <div className='relative mt-1 space-y-1'>
          {/* --- CHANGED ---: Adjusted left position to align with icons */}
          <div className='absolute left-[18px] -top-1 bottom-0 w-px bg-border/60' />
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

// ... (Helper components GoalStatusIcon and GoalActionsMenu remain unchanged) ...

function GoalStatusIcon({
  hasChildren,
  isExpanded,
  isPaused,
  isArchived,
  onToggle,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  isPaused: boolean;
  isArchived: boolean;
  onToggle: () => void;
}) {
  if (isPaused) return <PauseCircle className='h-4 w-4 text-amber-500' />;
  if (isArchived) return <Archive className='h-4 w-4' />;
  if (hasChildren) {
    return (
      <Button
        variant='ghost'
        size='icon'
        className='h-7 w-7'
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
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
    );
  }
  // --- CHANGED ---: Placed div inside button for consistent sizing and alignment
  // This ensures the space is identical to when the expander button is present.
  return <div className='h-7 w-7' />;
}

function GoalActionsMenu({
  goal,
  onStatusUpdate,
  onAddSubGoal,
}: {
  goal: GoalWithProgressAndChildren;
  onStatusUpdate: (status: GoalStatus) => void;
  onAddSubGoal: () => void;
}) {
  const isPaused = goal.status === 'PAUSED';
  const isArchived = goal.status === 'ARCHIVED';
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7'
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' onClick={(e) => e.stopPropagation()}>
        {!isArchived && !isPaused && (
          <DropdownMenuItem onClick={(e) => handleActionClick(e, onAddSubGoal)}>
            <PlusCircle className='mr-2 h-4 w-4' />
            <span>Add Sub-Goal</span>
          </DropdownMenuItem>
        )}
        {!isArchived && <DropdownMenuSeparator />}
        {goal.status === 'ACTIVE' && (
          <DropdownMenuItem
            onClick={(e) =>
              handleActionClick(e, () => onStatusUpdate(GoalStatus.PAUSED))
            }
          >
            <PauseCircle className='mr-2 h-4 w-4' />
            <span>Pause Goal</span>
          </DropdownMenuItem>
        )}
        {isPaused && (
          <DropdownMenuItem
            onClick={(e) =>
              handleActionClick(e, () => onStatusUpdate(GoalStatus.ACTIVE))
            }
          >
            <Play className='mr-2 h-4 w-4' />
            <span>Resume Goal</span>
          </DropdownMenuItem>
        )}
        {!isArchived ? (
          <DropdownMenuItem
            onClick={(e) =>
              handleActionClick(e, () => onStatusUpdate(GoalStatus.ARCHIVED))
            }
            className='focus:bg-destructive/80 focus:text-destructive-foreground'
          >
            <Archive className='mr-2 h-4 w-4' />
            <span>Archive Goal</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={(e) =>
              handleActionClick(e, () => onStatusUpdate(GoalStatus.ACTIVE))
            }
          >
            <ArchiveRestore className='mr-2 h-4 w-4' />
            <span>Restore Goal</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
