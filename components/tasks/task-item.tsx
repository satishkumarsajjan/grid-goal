'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type Task, TaskStatus } from '@prisma/client';
import { GripVertical, Clock, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type TaskWithTime } from '@/lib/types';

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
const deleteTask = async (taskId: string) => {
  await axios.delete(`/api/tasks/${taskId}`);
};

// --- Main Component ---
export function TaskItem({ task }: { task: TaskWithTime }) {
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
    zIndex: isDragging ? 10 : 'auto', // Ensure dragging item is on top
    opacity: isDragging ? 0.5 : 1,
  };

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] });
    },
    onError: () => {
      toast.error('Failed to update task.');
      // Revert local state on error
      setNewTitle(task.title);
      setNewTime(
        task.estimatedTimeSeconds
          ? (task.estimatedTimeSeconds / 3600).toString()
          : ''
      );
    },
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
    const timeInHours = parseFloat(newTime);
    // Only mutate if the state was 'editing' to avoid submits on blur from other actions
    if (isEditingTime) {
      const newSeconds =
        !isNaN(timeInHours) && timeInHours > 0 ? timeInHours * 3600 : null;
      // Check if value has actually changed to prevent unnecessary API calls
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

  const handleCheckedChange = (isChecked: boolean) => {
    updateMutation.mutate({
      taskId: task.id,
      payload: {
        status: isChecked ? TaskStatus.COMPLETED : TaskStatus.PENDING,
      },
    });
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;

  // Helper to format seconds into a clean "1.5h" or "45m" string
  const formatTime = (seconds: number | null | undefined): string | null => {
    if (seconds === null || seconds === undefined || seconds <= 0) return null;
    const hours = seconds / 3600;
    if (hours >= 1) {
      return `${Math.round(hours * 10) / 10}h`;
    }
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  const accumulatedTimeFormatted = formatTime(task.totalTimeSeconds);
  const estimatedTimeFormatted = formatTime(task.estimatedTimeSeconds);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-lg p-2 my-1 transition-all duration-200 ease-in-out',
        task.status === 'IN_PROGRESS' && 'bg-blue-900/10 dark:bg-blue-500/10',
        isCompleted && 'opacity-60',
        !isDragging && 'hover:bg-accent/50' // Apply hover effect only when not dragging
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab touch-none p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'
        aria-label='Drag to reorder task'
      >
        <GripVertical className='h-5 w-5' />
      </div>

      <Checkbox
        id={`task-${task.id}`}
        checked={isCompleted}
        onCheckedChange={handleCheckedChange}
        disabled={updateMutation.isPending}
      />

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

      <div
        className='flex items-center gap-1 text-xs font-mono text-muted-foreground'
        onDoubleClick={() => {
          if (!isCompleted) setIsEditingTime(true);
        }}
      >
        {isEditingTime ? (
          <Input
            ref={timeInputRef}
            type='number'
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            onBlur={handleSaveTime}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTime();
              if (e.key === 'Escape') setIsEditingTime(false);
            }}
            className='h-7 w-20 text-xs text-center'
            placeholder='Hours'
            step='0.1'
          />
        ) : (
          <>
            {accumulatedTimeFormatted && (
              <span className='text-foreground font-semibold'>
                {accumulatedTimeFormatted}
              </span>
            )}
            {accumulatedTimeFormatted && estimatedTimeFormatted && (
              <span className='font-sans'>/</span>
            )}
            {estimatedTimeFormatted && (
              <span className='cursor-text'>{estimatedTimeFormatted}</span>
            )}
            {!accumulatedTimeFormatted &&
              !estimatedTimeFormatted &&
              !isCompleted && (
                <Clock className='h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity' />
              )}
          </>
        )}
      </div>

      <Button
        variant='ghost'
        size='icon'
        onClick={() => deleteMutation.mutate(task.id)}
        className='h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-destructive'
        aria-label='Delete task'
        disabled={deleteMutation.isPending}
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  );
}
