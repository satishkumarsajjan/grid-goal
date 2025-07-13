import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Play,
  PlusCircle,
  Trash2,
} from 'lucide-react';

import { GoalWithProgressAndChildren } from '@/lib/types';
import { GoalStatus } from '@prisma/client';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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
