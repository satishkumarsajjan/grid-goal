'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // NEW: Import useRouter
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
  Trash2, // NEW: Import Trash2 icon
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
import {
  AlertDialog, // NEW: Import AlertDialog components
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

// NEW: Mutation function for deleting a goal
const deleteGoal = async (goalId: string) => {
  await axios.delete(`/api/goals/${goalId}`);
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
  const router = useRouter(); // NEW: Get router instance
  const [isExpanded, setIsExpanded] = useState(() => {
    if (goal.id === activeGoalId) return true;
    const checkForActiveChild = (g: GoalWithProgressAndChildren): boolean => {
      if (g.id === activeGoalId) return true;
      return g.children.some(checkForActiveChild);
    };
    return checkForActiveChild(goal);
  });

  // NEW: State to control the delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  // NEW: Delete mutation logic
  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      toast.success('Goal and all its sub-goals deleted.');
      // Invalidate queries to refetch the goal list
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      // If the currently active goal was the one deleted, redirect to the main goals page
      if (isActive) {
        router.push('/goals');
      }
    },
    onError: (error) => {
      toast.error('Failed to delete goal.');
      console.error(error);
    },
    onSettled: () => {
      setShowDeleteDialog(false); // Close the dialog
    },
  });

  const handleStatusUpdate = (status: GoalStatus) => {
    statusMutation.mutate({ goalId: goal.id, status });
  };

  const handleAddSubGoal = () => {
    openCreationDialog({ open: true, parentId: goal.id });
  };

  return (
    <>
      <div
        className='relative'
        style={{ paddingLeft: `${level * INDENT_SIZE_REM}rem` }}
      >
        <div
          className={cn(
            'group relative rounded-md w-full transition-colors py-1 pr-2 pl-4',
            isActive && !isArchived
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/60',
            (isPaused || isArchived) && 'text-muted-foreground opacity-75'
          )}
        >
          <div
            className='absolute left-0 top-0 h-full w-1 rounded-l-md'
            style={{ backgroundColor: goal.color || 'transparent' }}
          />

          <div className='flex h-8 items-center gap-2 w-full'>
            <div className='flex h-full w-8 items-center justify-center flex-shrink-0'>
              <GoalStatusIcon
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                isPaused={isPaused}
                isArchived={isArchived}
                onToggle={() => setIsExpanded(!isExpanded)}
              />
            </div>

            <Link
              href={`/goals/${goal.id}`}
              className='flex-1 min-w-0 flex items-center'
            >
              <span
                className={cn(
                  'truncate font-medium text-sm',
                  isArchived && 'line-through'
                )}
              >
                {goal.title}
              </span>
            </Link>

            <div className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'>
              <GoalActionsMenu
                goal={goal}
                onStatusUpdate={handleStatusUpdate}
                onAddSubGoal={handleAddSubGoal}
                onDelete={() => setShowDeleteDialog(true)} // NEW: Trigger delete dialog
              />
            </div>
          </div>

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

        {hasChildren && isExpanded && !isArchived && (
          <div className='relative mt-1 space-y-1'>
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

      {/* NEW: Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              goal "{goal.title}" and **all of its sub-goals**. All associated
              tasks and focus sessions will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => deleteMutation.mutate(goal.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete goal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
  return <div className='h-7 w-7' />;
}

function GoalActionsMenu({
  goal,
  onStatusUpdate,
  onAddSubGoal,
  onDelete, // NEW: Add onDelete prop
}: {
  goal: GoalWithProgressAndChildren;
  onStatusUpdate: (status: GoalStatus) => void;
  onAddSubGoal: () => void;
  onDelete: () => void; // NEW: Define type
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
        {/* NEW: Delete Option */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='text-destructive focus:bg-destructive focus:text-destructive-foreground'
          onClick={(e) => handleActionClick(e, onDelete)}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
