'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type Task, TaskStatus, type DailyQueueItem } from '@prisma/client';
import {
  Clock,
  GripVertical,
  PlayCircle,
  Trash2,
  CheckCircle2,
  Circle,
  Loader,
  ArrowUpRightFromSquare,
  Check,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { type TaskWithTime } from '@/lib/types';
import { useTimerStore } from '@/store/timer-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

// --- Helper Component for Status Icon ---
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
}) => {
  const { data } = await axios.patch(`/api/tasks/${taskId}`, payload);
  return data;
};
const deleteTask = async (taskId: string) =>
  await axios.delete(`/api/tasks/${taskId}`);
const fetchQueue = async (): Promise<DailyQueueItem[]> => {
  const { data } = await axios.get('/api/daily-queue');
  return data;
};
const addToQueue = async (taskId: string) => {
  const { data } = await axios.post('/api/daily-queue', { taskId });
  return data;
};

// --- Main Component ---
export function TaskItem({ task }: { task: TaskWithTime }) {
  const queryClient = useQueryClient();
  const startSession = useTimerStore((state) => state.startSession);

  // --- State and Refs ---
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

  // --- Drag & Drop Hook ---
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

  // --- Data Queries & Mutations ---
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

  // --- Effects and Handlers ---
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
    /* ... (logic from previous step) */
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

  const renderTimeInfo = () => {
    // Show estimated and accumulated time, or allow editing estimated time
    if (isEditingTime) {
      return (
        <Input
          ref={timeInputRef}
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          onBlur={() => {
            setIsEditingTime(false);
            setNewTime(
              task.estimatedTimeSeconds
                ? (task.estimatedTimeSeconds / 3600).toString()
                : ''
            );
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Save logic for estimated time
              const hours = parseFloat(newTime);
              if (!isNaN(hours) && hours >= 0) {
                updateMutation.mutate({
                  taskId: task.id,
                  payload: {
                    estimatedTimeSeconds:
                      hours > 0 ? Math.round(hours * 3600) : null,
                  },
                });
              }
              setIsEditingTime(false);
            }
            if (e.key === 'Escape') {
              setIsEditingTime(false);
              setNewTime(
                task.estimatedTimeSeconds
                  ? (task.estimatedTimeSeconds / 3600).toString()
                  : ''
              );
            }
          }}
          className='h-7 w-16 px-1 text-xs font-mono'
          disabled={updateMutation.isPending}
        />
      );
    }

    return (
      <>
        {estimatedTimeFormatted && (
          <span className='flex items-center gap-1 text-muted-foreground'>
            <Clock className='h-3.5 w-3.5' />
            {estimatedTimeFormatted}
          </span>
        )}
        {accumulatedTimeFormatted && (
          <span className='flex items-center gap-1'>
            <Check className='h-3.5 w-3.5 text-green-500' />
            {accumulatedTimeFormatted}
          </span>
        )}
      </>
    );
  };

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
        className='flex items-center gap-1 text-xs font-mono'
        onDoubleClick={() => {
          if (!isCompleted) setIsEditingTime(true);
        }}
      >
        {renderTimeInfo()}
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
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => startSession(task.id, task.goalId)}
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
