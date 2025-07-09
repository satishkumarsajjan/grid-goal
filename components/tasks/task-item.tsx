'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskStatus, type DailyQueueItem } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowUpRightFromSquare,
  Check,
  GripVertical,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type TaskWithTime } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { StatusIcon } from '@/lib/status-icon';

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
}) => (await axios.patch(`/api/tasks/${taskId}`, payload)).data;
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

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [newTime, setNewTime] = useState(
    task.estimatedTimeSeconds
      ? (task.estimatedTimeSeconds / 3600).toString()
      : ''
  );
  const titleInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // --- START OF DRAG-AND-DROP IMPROVEMENTS ---
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // This state is key for the "lifted" style
  } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  // dnd-kit provides transform and transition for smooth, hardware-accelerated animations.
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease', // Add a fallback transition
    // When dragging, lift the item above others with a higher z-index
    zIndex: isDragging ? 10 : 'auto',
  };
  // --- END OF DRAG-AND-DROP IMPROVEMENTS ---

  const { data: queueItems } = useQuery<DailyQueueItem[]>({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
  });
  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['taskListData', task.goalId],
      }),
    onError: () => toast.error('Failed to update task.'),
    onSettled: () => {
      setIsEditingTitle(false);
      setIsEditingTime(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success('Task deleted.');
      queryClient.invalidateQueries({
        queryKey: ['taskListData', task.goalId],
      });
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

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.select();
  }, [isEditingTitle]);
  useEffect(() => {
    if (isEditingTime) timeInputRef.current?.select();
  }, [isEditingTime]);

  const handleSaveTitle = () => {
    /* ... remains the same ... */
  };
  const handleSaveTime = () => {
    /* ... remains the same ... */
  };
  const handleStatusChange = () => {
    /* ... remains the same ... */
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInQueue = queueItems?.some((item) => item.taskId === task.id);
  const isMutationPending =
    updateMutation.isPending ||
    deleteMutation.isPending ||
    addToQueueMutation.isPending;

  const formatTime = (seconds: number | null | undefined): string | null => {
    if (seconds === null || seconds === undefined || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const accumulatedTimeFormatted = formatTime(task.totalTimeSeconds);
  const estimatedTimeFormatted = formatTime(task.estimatedTimeSeconds);

  return (
    <div
      ref={setNodeRef}
      style={style}
      // IMPROVEMENT: Apply styles based on the isDragging state
      className={cn(
        'group flex items-center gap-3 rounded-lg border p-2 my-1 transition-all duration-200 ease-in-out relative',
        isCompleted && 'opacity-50',
        isDragging
          ? 'bg-background border-primary shadow-lg scale-[1.02]' // The "lifted" style
          : 'bg-card border-transparent',
        !isDragDisabled &&
          !isDragging &&
          'hover:bg-accent/50 hover:border-border'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'cursor-grab touch-none p-1 text-muted-foreground transition-opacity',
          isDragDisabled
            ? 'opacity-20 cursor-not-allowed'
            : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        )}
        aria-label='Drag to reorder task'
      >
        <GripVertical className='h-5 w-5' />
      </div>

      <Button
        variant='ghost'
        size='icon'
        onClick={handleStatusChange}
        disabled={isMutationPending || isDragDisabled}
        className='h-8 w-8 rounded-full'
        aria-label={`Mark task as ${isCompleted ? 'pending' : 'completed'}`}
      >
        <StatusIcon status={task.status} />
      </Button>

      <div
        className='flex-1'
        onDoubleClick={() => {
          if (!isCompleted && !isDragDisabled) setIsEditingTitle(true);
        }}
      >
        {isEditingTitle ? (
          <Input /* ... */ />
        ) : (
          <span
            className={cn(
              'text-sm font-medium',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
        )}
      </div>

      <div
        className='flex items-center gap-1.5 text-xs font-mono w-24 justify-end'
        onDoubleClick={() => {
          if (!isCompleted && !isDragDisabled) setIsEditingTime(true);
        }}
      >
        {isEditingTime ? (
          <Input /* ... */ />
        ) : (
          <>
            {accumulatedTimeFormatted && (
              <span className='text-primary font-semibold'>
                {accumulatedTimeFormatted}
              </span>
            )}
            {accumulatedTimeFormatted && estimatedTimeFormatted && (
              <span className='text-muted-foreground'>/</span>
            )}
            {estimatedTimeFormatted && <span>{estimatedTimeFormatted}</span>}
          </>
        )}
      </div>

      {/* The action buttons are now styled to be more subtle by default */}
      <div
        className={cn(
          'flex items-center transition-opacity',
          isDragging
            ? 'opacity-0'
            : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
        )}
      >
        <TooltipProvider delayDuration={200}>
          {!isCompleted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => addToQueueMutation.mutate(task.id)}
                  disabled={
                    isInQueue || addToQueueMutation.isPending || isDragDisabled
                  }
                  className='h-8 w-8 rounded-full text-muted-foreground hover:text-primary'
                >
                  {isInQueue ? (
                    <Check className='h-4 w-4 text-primary' />
                  ) : (
                    <ArrowUpRightFromSquare className='h-4 w-4' />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isInQueue
                    ? "Added to Today's Focus"
                    : "Add to Today's Focus"}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {!isCompleted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onStartSession(task)}
                  disabled={isDragDisabled}
                  className='h-8 w-8 rounded-full text-muted-foreground hover:text-primary'
                  aria-label='Start focus session'
                >
                  <PlayCircle className='h-5 w-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start Focus Session</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => deleteMutation.mutate(task.id)}
                disabled={deleteMutation.isPending || isDragDisabled}
                className='h-8 w-8 rounded-full text-muted-foreground hover:text-destructive'
                aria-label='Delete task'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Task</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
