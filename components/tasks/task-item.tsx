'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskStatus, type DailyQueueItem } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowUpRightFromSquare,
  Check,
  CheckCircle2,
  Circle,
  GripVertical,
  Loader,
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

// --- Helper Component for Status Icon (Unchanged) ---
function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case TaskStatus.COMPLETED:
      return <CheckCircle2 className='h-5 w-5 text-green-500' />;
    case TaskStatus.IN_PROGRESS:
      return (
        <Loader
          className='h-5 w-5 text-blue-500 animate-spin'
          style={{ animationDuration: '2s' }}
        />
      );
    case TaskStatus.PENDING:
    default:
      return (
        <Circle className='h-5 w-5 text-muted-foreground transition-colors' />
      );
  }
}

// --- Type Definitions & API Functions ---
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

// --- Component Props ---
interface TaskItemProps {
  task: TaskWithTime;
  onStartSession: (task: TaskWithTime) => void; // The new required prop
}

// --- Main Component ---
export function TaskItem({ task, onStartSession }: TaskItemProps) {
  const queryClient = useQueryClient();

  // State and Refs
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

  // Drag & Drop Hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  // Data Queries & Mutations
  const { data: queueItems } = useQuery<DailyQueueItem[]>({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
  });
  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] }),
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
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] });
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

  // Effects and Handlers
  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.select();
  }, [isEditingTitle]);
  useEffect(() => {
    if (isEditingTime) timeInputRef.current?.select();
  }, [isEditingTime]);

  const handleSaveTitle = () => {
    const trimmedTitle = newTitle.trim();
    if (isEditingTitle && trimmedTitle && trimmedTitle !== task.title) {
      updateMutation.mutate({
        taskId: task.id,
        payload: { title: trimmedTitle },
      });
    } else {
      setIsEditingTitle(false);
      setNewTitle(task.title);
    }
  };

  const handleSaveTime = () => {
    if (isEditingTime) {
      const timeInHours = parseFloat(newTime);
      const newSeconds =
        !isNaN(timeInHours) && timeInHours > 0 ? timeInHours * 3600 : null;
      if (newSeconds !== task.estimatedTimeSeconds) {
        updateMutation.mutate({
          taskId: task.id,
          payload: { estimatedTimeSeconds: newSeconds },
        });
      } else {
        setIsEditingTime(false);
      }
    }
  };

  const handleStatusChange = () => {
    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.PENDING
        : TaskStatus.COMPLETED;
    updateMutation.mutate({ taskId: task.id, payload: { status: newStatus } });
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInQueue = queueItems?.some((item) => item.taskId === task.id);

  const formatTime = (seconds: number | null | undefined): string | null => {
    if (seconds === null || seconds === undefined || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const accumulatedTimeFormatted = formatTime(task.totalTimeSeconds);
  const estimatedTimeFormatted = formatTime(task.estimatedTimeSeconds);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-transparent p-2 my-1 transition-all duration-200 ease-in-out',
        isCompleted && 'opacity-50',
        !isDragging && 'hover:bg-accent/50 hover:border-border'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab touch-none p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'
        aria-label='Drag to reorder task'
      >
        <GripVertical className='h-5 w-5' />
      </div>

      {/* Status Icon Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={handleStatusChange}
        disabled={updateMutation.isPending}
        className='h-8 w-8 rounded-full'
        aria-label={`Mark task as ${isCompleted ? 'pending' : 'completed'}`}
      >
        <StatusIcon status={task.status} />
      </Button>

      {/* Task Title */}
      <div
        className='flex-1'
        onDoubleClick={() => {
          if (!isCompleted) setIsEditingTitle(true);
        }}
      >
        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            className='h-8 bg-background text-sm'
            disabled={updateMutation.isPending}
          />
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

      {/* Time Info */}
      <div
        className='flex items-center gap-1.5 text-xs font-mono w-24 justify-end'
        onDoubleClick={() => {
          if (!isCompleted) setIsEditingTime(true);
        }}
      >
        {isEditingTime ? (
          <Input
            ref={timeInputRef}
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            onBlur={handleSaveTime}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTime();
              if (e.key === 'Escape') setIsEditingTime(false);
            }}
            className='h-7 w-20 text-xs'
            placeholder='Hours'
            step='0.1'
            type='number'
            disabled={updateMutation.isPending}
          />
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

      {/* Action Buttons */}
      <div className='flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'>
        {!isCompleted && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => addToQueueMutation.mutate(task.id)}
                  disabled={isInQueue || addToQueueMutation.isPending}
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
          </TooltipProvider>
        )}

        {!isCompleted && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* THIS IS THE KEY CHANGE: onClick now calls the prop from the parent */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onStartSession(task)}
                  className='h-8 w-8 rounded-full text-muted-foreground hover:text-primary'
                  aria-label='Start focus session'
                >
                  <PlayCircle className='h-5 w-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start Focus Session</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => deleteMutation.mutate(task.id)}
                className='h-8 w-8 rounded-full text-muted-foreground hover:text-destructive'
                aria-label='Delete task'
                disabled={deleteMutation.isPending}
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
