'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type Task, TaskStatus } from '@prisma/client';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

interface TaskItemProps {
  task: Task;
}

// Define the shape of the data for the update mutation
interface UpdateTaskPayload {
  status?: TaskStatus;
  title?: string;
}

// Define the mutation function that calls our API
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

export function TaskItem({ task }: TaskItemProps) {
  const queryClient = useQueryClient();

  // Set up the mutation using TanStack Query
  const mutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      // When a task is updated, we want to re-fetch the list of tasks for its parent goal.
      // We use the goalId from the task prop to invalidate the correct query.
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] });
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      // Here you could add a toast notification to inform the user of the failure.
    },
  });

  // Handler for when the checkbox state changes
  const handleCheckedChange = (isChecked: boolean) => {
    const newStatus = isChecked ? TaskStatus.COMPLETED : TaskStatus.PENDING;

    // Don't do anything if the status is already what we want it to be.
    if (task.status === newStatus) return;

    // Call the mutation to update the task's status
    mutation.mutate({
      taskId: task.id,
      payload: { status: newStatus },
    });
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <div className='flex items-center space-x-3 rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50'>
      <Checkbox
        id={task.id}
        checked={isCompleted}
        onCheckedChange={handleCheckedChange}
        disabled={mutation.isPending} // Disable checkbox while the update is in progress
        aria-label={`Mark task "${task.title}" as ${
          isCompleted ? 'incomplete' : 'complete'
        }`}
      />
      <Label
        htmlFor={task.id}
        className={cn(
          'flex-1 cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200',
          isCompleted && 'text-gray-500 line-through dark:text-gray-400'
        )}
      >
        {task.title}
      </Label>
      {/* 
        Here is where you would add a "three-dot" context menu in the future
        for actions like "Delete Task" or "Move Task".
      */}
    </div>
  );
}
