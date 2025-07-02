'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { type Task, TaskStatus } from '@prisma/client';
import { GripVertical } from 'lucide-react';

// dnd-kit imports for making the item sortable
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

// --- Type Definition & API Function ---

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

// --- Component Props ---

interface TaskItemProps {
  task: Task;
}

// --- Main Component ---

export function TaskItem({ task }: TaskItemProps) {
  const queryClient = useQueryClient();

  // State for managing inline editing
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // dnd-kit's useSortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Style object for dnd-kit to apply transformations
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Make item semi-transparent while dragging
  };

  // TanStack Query mutation hook for all updates
  const mutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] });
    },
    onError: (error: AxiosError) => {
      setNewTitle(task.title); // Revert title on error
      console.error('Failed to update task:', error.message);
    },
    onSettled: () => {
      if (isEditing) {
        setIsEditing(false);
      }
    },
  });

  // Focus the input when entering editing mode
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Handler for checkbox changes
  const handleCheckedChange = (isChecked: boolean) => {
    const newStatus = isChecked ? TaskStatus.COMPLETED : TaskStatus.PENDING;
    mutation.mutate({
      taskId: task.id,
      payload: { status: newStatus },
    });
  };

  // Handler for saving the edited title
  const handleSaveTitle = () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || trimmedTitle === task.title) {
      setIsEditing(false);
      setNewTitle(task.title);
      return;
    }
    mutation.mutate({
      taskId: task.id,
      payload: { title: trimmedTitle },
    });
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    // The main div gets the ref, style, and props from dnd-kit
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center space-x-2 rounded-md p-2 transition-colors', // Added a `group` class for hover effects
        'hover:bg-gray-100 dark:hover:bg-gray-800/50',
        task.status === 'IN_PROGRESS' && 'bg-blue-50 dark:bg-blue-900/20'
      )}
    >
      {/* 
        The drag handle. It gets the listeners from dnd-kit.
        It's only visible when the user hovers over the task item for a cleaner UI.
      */}
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab touch-none opacity-50 transition-opacity group-hover:opacity-100'
        aria-label='Drag to reorder task'
      >
        <GripVertical className='h-5 w-5 text-gray-400' />
      </div>

      <Checkbox
        id={`checkbox-${task.id}`} // Use a more unique ID for the checkbox
        checked={isCompleted}
        onCheckedChange={handleCheckedChange}
        disabled={mutation.isPending}
        aria-label={`Mark task "${task.title}" as ${
          isCompleted ? 'incomplete' : 'complete'
        }`}
      />

      <div className='flex-1'>
        {isEditing ? (
          <Input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setNewTitle(task.title);
              }
            }}
            className='h-8 bg-white text-sm dark:bg-gray-900'
            disabled={mutation.isPending}
          />
        ) : (
          <Label
            // Use a unique htmlFor to match the checkbox's new ID
            htmlFor={`checkbox-${task.id}`}
            onClick={(e) => {
              e.preventDefault();
              if (!isCompleted) {
                setIsEditing(true);
              }
            }}
            className={cn(
              'text-sm font-medium',
              isCompleted
                ? 'cursor-pointer text-gray-500 line-through dark:text-gray-400'
                : 'cursor-text text-gray-800 dark:text-gray-200'
            )}
          >
            {task.title}
          </Label>
        )}
      </div>
    </div>
  );
}
