'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, PlusCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type GoalWithProgressAndChildren } from '@/lib/types'; // <-- Use our new, more descriptive type

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // <-- Import the Progress component
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// The interface is updated to expect the new goal type with progress counts.
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
  // isExpandedInitially logic remains the same.
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

  // --- NEW: Calculate progress ---
  const totalTasks = goal.totalTasks;
  const completedTasks = goal.completedTasks;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddSubGoal = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreationDialog({ open: true, parentId: goal.id });
  };

  return (
    <div>
      {/* Main container div */}
      <div
        className={cn(
          'group flex items-center justify-between rounded-md text-sm font-medium transition-colors w-full',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/50 hover:text-accent-foreground',
          // Use CSS variables for a dynamic indentation effect
          'pl-[calc(var(--indent-level)_*_1rem)]'
        )}
        style={{ '--indent-level': level } as React.CSSProperties}
      >
        <div className='flex items-center flex-1 truncate min-w-0'>
          {/* Expander Button */}
          <Button
            variant='ghost'
            size='icon'
            className={cn('h-7 w-7', !hasChildren && 'invisible')} // Hide if no children
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
            />
          </Button>

          {/* Goal Link - Now wraps the title and progress bar */}
          <Link
            href={`/goals/${goal.id}`}
            className='flex-1 truncate py-2 pr-2'
          >
            <span className='block truncate'>{goal.title}</span>

            {/* --- NEW: Progress Bar and Text --- */}
            {/* Only show the progress bar if there are tasks associated with the goal */}
            {totalTasks > 0 && (
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
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleAddSubGoal}>
                <PlusCircle className='mr-2 h-4 w-4' />
                <span>Add Sub-Goal</span>
              </DropdownMenuItem>
              {/* TODO: Add other actions like "Pause Goal", "Delete" */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Recursive Rendering of Children */}
      {hasChildren && isExpanded && (
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
