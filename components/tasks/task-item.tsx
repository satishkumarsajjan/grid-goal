'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type Task, TaskStatus } from '@prisma/client';
import {
  Clock,
  GripVertical,
  PlayCircle,
  Trash2,
  CheckCircle2,
  Circle,
  Loader,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { type TaskWithTime } from '@/lib/types';
import { useTimerStore } from '@/store/timer-store';

// A small helper component to render the correct status icon.
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

interface UpdateTaskPayload {
  status?: TaskStatus;
  title?: string;
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

export function TaskItem({ task }: { task: TaskWithTime }) {
  const queryClient = useQueryClient();
  const startSession = useTimerStore((state) => state.startSession);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] }),
    onError: () => toast.error('Failed to update task.'),
    onSettled: () => setIsEditing(false),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] });
      toast.success('Task deleted.');
    },
    onError: () => toast.error('Failed to delete task.'),
  });

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const handleSaveTitle = () => {
    const trimmedTitle = newTitle.trim();
    if (isEditing && trimmedTitle && trimmedTitle !== task.title) {
      updateMutation.mutate({
        taskId: task.id,
        payload: { title: trimmedTitle },
      });
    }
    setIsEditing(false);
  };

  const handleStatusChange = () => {
    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.PENDING
        : TaskStatus.COMPLETED;
    updateMutation.mutate({ taskId: task.id, payload: { status: newStatus } });
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;

  const formatTime = (seconds: number | null | undefined): string | null => {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const loggedTime = formatTime(task.totalTimeSeconds);
  const estimatedTime = formatTime(task.estimatedTimeSeconds);

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
      {/* INTERACTION ZONE (Left) */}
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab touch-none p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'
        aria-label='Drag to reorder task'
      >
        <GripVertical className='h-5 w-5' />
      </div>
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

      {/* CONTENT ZONE (Middle) */}
      <div
        className='flex-1'
        onDoubleClick={() => {
          if (!isCompleted) setIsEditing(true);
        }}
      >
        {isEditing ? (
          <Input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditing(false);
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

      {/* ACTION ZONE (Right) */}
      <div className='flex items-center gap-4'>
        {/* The Time Block */}
        <div className='flex items-center gap-1.5 text-xs font-mono text-muted-foreground w-24 justify-end'>
          {loggedTime && <span>{loggedTime}</span>}
          {loggedTime && estimatedTime && (
            <span className='text-gray-600'>/</span>
          )}
          {estimatedTime && !loggedTime && <Clock className='h-3 w-3' />}
          {estimatedTime && <span>{estimatedTime}</span>}
        </div>

        {/* Hover Actions */}
        <div className='flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'>
          {!isCompleted && (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => startSession(task.id, task.goalId)}
              className='h-8 w-8 rounded-full text-muted-foreground hover:text-primary'
              aria-label='Start focus session'
            >
              <PlayCircle className='h-5 w-5' />
            </Button>
          )}
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
        </div>
      </div>
    </div>
  );
}
