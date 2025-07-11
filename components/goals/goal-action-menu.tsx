// At the top of your file, make sure all necessary icons are imported
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Play,
  PlusCircle,
  Trash2,
  AlertTriangle, // NEW: Import AlertTriangle for the danger zone
} from 'lucide-react';

// Also import the new DropdownMenuSub components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal, // NEW
  DropdownMenuSeparator,
  DropdownMenuSub, // NEW
  DropdownMenuSubContent, // NEW
  DropdownMenuSubTrigger, // NEW
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { GoalWithProgressAndChildren } from '@/lib/types';
import { GoalStatus } from '@prisma/client';
import { Button } from '../ui/button';

// ... other components and functions from the file

// The updated GoalActionsMenu component
export function GoalActionsMenu({
  goal,
  onStatusUpdate,
  onAddSubGoal,
  onEdit,
  onDelete,
}: {
  goal: GoalWithProgressAndChildren;
  onStatusUpdate: (status: GoalStatus) => void;
  onAddSubGoal: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaused = goal.status === 'PAUSED';
  const isArchived = goal.status === 'ARCHIVED';

  // This helper is still useful for actions that trigger dialogs
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
          // FIX: No longer using preventDefault here as it's not needed.
          // FIX: Added a descriptive aria-label for accessibility.
          aria-label={`Actions for goal: ${goal.title}`}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' onClick={(e) => e.stopPropagation()}>
        {!isArchived && (
          <DropdownMenuItem onClick={(e) => handleActionClick(e, onEdit)}>
            <Pencil className='mr-2 h-4 w-4' />
            <span>Edit</span>
          </DropdownMenuItem>
        )}
        {!isArchived && !isPaused && (
          <DropdownMenuItem onClick={(e) => handleActionClick(e, onAddSubGoal)}>
            <PlusCircle className='mr-2 h-4 w-4' />
            <span>Add Sub-Goal</span>
          </DropdownMenuItem>
        )}

        {/* Separator to group actions */}
        {!isArchived && <DropdownMenuSeparator />}

        {goal.status === 'ACTIVE' && (
          <DropdownMenuItem onClick={() => onStatusUpdate(GoalStatus.PAUSED)}>
            <PauseCircle className='mr-2 h-4 w-4' />
            <span>Pause Goal</span>
          </DropdownMenuItem>
        )}
        {isPaused && (
          <DropdownMenuItem onClick={() => onStatusUpdate(GoalStatus.ACTIVE)}>
            <Play className='mr-2 h-4 w-4' />
            <span>Resume Goal</span>
          </DropdownMenuItem>
        )}
        {!isArchived ? (
          <DropdownMenuItem onClick={() => onStatusUpdate(GoalStatus.ARCHIVED)}>
            <Archive className='mr-2 h-4 w-4' />
            <span>Archive Goal</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onStatusUpdate(GoalStatus.ACTIVE)}>
            <ArchiveRestore className='mr-2 h-4 w-4' />
            <span>Restore Goal</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Trash2 className='mr-2 h-4 w-4 text-red-500' />
          <Button
            variant={'destructive'}
            onClick={(e) => handleActionClick(e, onDelete)}
          >
            <span>Delete Goal</span>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
