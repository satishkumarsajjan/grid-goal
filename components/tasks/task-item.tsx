'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskStatus, type DailyQueueItem } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowUpRightFromSquare,
  Check,
  Clock,
  GripVertical,
  MoreVertical,
  Pencil,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { StatusIcon } from '@/lib/status-icon';
import { type TaskWithTime } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { EditTaskDialog } from './EditTaskDialog';

// API functions remain unchanged
interface UpdateTaskPayload {
  status?: TaskStatus;
  title?: string;
  estimatedTimeSeconds?: number | null;
}
const updateTask = async ({
  taskId,
  payload,
}: {
  taskId: string;
  payload: UpdateTaskPayload;
}) => {
  const { data } = await axios.patch(`/api/tasks/${taskId}`, payload);
  return data;
};
const deleteTask = async (taskId: string) =>
  await axios.delete(`/api/tasks/${taskId}`);
const fetchQueue = async (): Promise<DailyQueueItem[]> =>
  (await axios.get('/api/daily-queue')).data;
const addToQueue = async (taskId: string) =>
  (await axios.post('/api/daily-queue', { taskId })).data;

interface TaskItemProps {
  task: TaskWithTime;
  onStartSession: (task: TaskWithTime) => void;
  isDragDisabled?: boolean;
}

export function TaskItem({
  task,
  onStartSession,
  isDragDisabled = false,
}: TaskItemProps) {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDragDisabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const { data: queueItems } = useQuery<DailyQueueItem[]>({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: TaskStatus) =>
      updateTask({ taskId: task.id, payload: { status: newStatus } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', task.goalId] });
    },
    onError: () => toast.error('Failed to update task status.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success('Task deleted.');
      queryClient.invalidateQueries({ queryKey: ['goal', task.goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['estimationAccuracy'] });
    },
    onError: () => toast.error('Failed to delete task.'),
  });

  const addToQueueMutation = useMutation({
    mutationFn: addToQueue,
    onSuccess: () => {
      toast.success(`"${task.title}" added to today's focus.`);
      queryClient.invalidateQueries({ queryKey: ['dailyQueue'] });
    },
    onError: () => toast.error('Failed to add task to queue.'),
  });

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInQueue = queueItems?.some((item) => item.taskId === task.id);
  const isMutationPending =
    updateStatusMutation.isPending ||
    deleteMutation.isPending ||
    addToQueueMutation.isPending;

  const formatTime = (seconds: number | null | undefined): string | null => {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };
  const accumulatedTimeFormatted = formatTime(task.totalTimeSpentSeconds);
  const estimatedTimeFormatted = formatTime(task.estimatedTimeSeconds);

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center gap-2 rounded-lg border p-3 my-1 transition-all duration-200 ease-in-out relative bg-card',
          isCompleted && 'opacity-60',
          isDragging && 'bg-background border-primary shadow-lg scale-[1.02]',
          !isDragDisabled && !isDragging && 'hover:bg-accent/50'
        )}
      >
        {/* Drag Handle - now visible on desktop hover, and acts as the main touch area for mobile drag */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'cursor-grab touch-none p-1 text-muted-foreground md:opacity-0 md:group-hover:opacity-100'
          )}
          aria-label='Drag to reorder task'
        >
          <GripVertical className='h-5 w-5' />
        </div>

        {/* Status Checkbox */}
        <Button
          variant='ghost'
          size='icon'
          onClick={() =>
            updateStatusMutation.mutate(
              isCompleted ? TaskStatus.PENDING : TaskStatus.COMPLETED
            )
          }
          disabled={isMutationPending || isDragDisabled}
          className='h-8 w-8 rounded-full flex-shrink-0'
          aria-label={`Mark task as ${isCompleted ? 'pending' : 'completed'}`}
        >
          <StatusIcon status={task.status} />
        </Button>

        {/* Main Content Area - Stacks vertically on mobile */}
        <div className='flex-1 flex flex-col min-w-0'>
          <span
            className={cn(
              'text-sm font-medium truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
          {/* Time estimates are shown below the title on mobile */}
          {(accumulatedTimeFormatted || estimatedTimeFormatted) && (
            <div className='flex items-center gap-1.5 text-xs font-mono text-muted-foreground'>
              <Clock className='h-3 w-3' />
              {accumulatedTimeFormatted && (
                <span className='text-primary font-semibold'>
                  {accumulatedTimeFormatted}
                </span>
              )}
              {accumulatedTimeFormatted && estimatedTimeFormatted && (
                <span>/</span>
              )}
              {estimatedTimeFormatted && <span>{estimatedTimeFormatted}</span>}
            </div>
          )}
        </div>

        {/* Action Buttons - a single 'Play' button on desktop, all in a menu on mobile */}
        <div className='flex items-center ml-auto'>
          {!isCompleted && (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onStartSession(task)}
              disabled={isDragDisabled}
              className='h-9 w-9 hidden md:inline-flex text-muted-foreground hover:text-primary'
              aria-label='Start focus session'
            >
              <PlayCircle className='h-5 w-5' />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-9 w-9'>
                <MoreVertical className='h-4 w-4' />
                <span className='sr-only'>
                  More options for task {task.title}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {!isCompleted && (
                <>
                  {/* Show "Start Session" in menu ONLY on mobile */}
                  <DropdownMenuItem
                    onClick={() => onStartSession(task)}
                    className='md:hidden'
                  >
                    <PlayCircle className='mr-2 h-4 w-4' />
                    <span>Start Session</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Pencil className='mr-2 h-4 w-4' />
                    <span>Edit Task</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addToQueueMutation.mutate(task.id)}
                    disabled={isInQueue || addToQueueMutation.isPending}
                  >
                    {isInQueue ? (
                      <Check className='mr-2 h-4 w-4 text-primary' />
                    ) : (
                      <ArrowUpRightFromSquare className='mr-2 h-4 w-4' />
                    )}
                    <span>{isInQueue ? 'In Queue' : 'Add to Queue'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(task.id)}
                disabled={deleteMutation.isPending}
                className='text-destructive focus:text-destructive'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                <span>Delete Task</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>

      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={task}
      />
    </>
  );
}
