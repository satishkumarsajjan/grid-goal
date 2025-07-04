'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, PlusCircle, MoreHorizontal } from 'lucide-react';
import { type GoalWithChildren } from '@/lib/goal-helpers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Import DropdownMenu for hover actions.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GoalNavigatorItemProps {
  goal: GoalWithChildren;
  activeGoalId: string | null;
  level: number;
  openCreationDialog: (options: { open: boolean; parentId?: string }) => void;
}

/**
 * A recursive component that renders a single goal and its children.
 * It manages its own expanded/collapsed state.
 */
export function GoalNavigatorItem({
  goal,
  activeGoalId,
  level,
  openCreationDialog,
}: GoalNavigatorItemProps) {
  const pathname = usePathname();

  // A goal should be expanded by default if its own page or one of its children's pages is active.
  const isExpandedInitially = useMemo(() => {
    if (goal.id === activeGoalId) return true;
    const checkForActiveChild = (g: GoalWithChildren): boolean => {
      if (g.id === activeGoalId) return true;
      return g.children.some(checkForActiveChild);
    };
    return checkForActiveChild(goal);
  }, [goal, activeGoalId]);

  const [isExpanded, setIsExpanded] = useState(isExpandedInitially);

  const hasChildren = goal.children.length > 0;
  const isActive = goal.id === activeGoalId;

  const handleAddSubGoal = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreationDialog({ open: true, parentId: goal.id });
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center justify-between rounded-md text-sm font-medium transition-colors w-full',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/50 hover:text-accent-foreground',
          'pl-[calc(var(--indent-level)_*_1.25rem)]'
        )}
        // Use CSS variables for a dynamic indentation effect
        style={{ '--indent-level': level } as React.CSSProperties}
      >
        <div className='flex items-center flex-1 truncate'>
          {/* Expander Button */}
          <Button
            variant='ghost'
            size='icon'
            className={cn('h-6 w-6 mr-1', !hasChildren && 'invisible')} // Hide if no children
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

          {/* Goal Link */}
          <Link
            href={`/goals/${goal.id}`}
            className='flex-1 truncate py-2 pr-2'
          >
            {goal.title}
          </Link>
        </div>

        {/* Hover Actions Menu */}
        <div className='pr-2 opacity-0 group-hover:opacity-100 transition-opacity'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-6 w-6'>
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
              level={level + 1} // Increment the indentation level for children
              openCreationDialog={openCreationDialog}
            />
          ))}
        </div>
      )}
    </div>
  );
}
