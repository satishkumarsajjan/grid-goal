'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { type Task } from '@prisma/client';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

type TaskWithGoal = Task & { goal: { title: string } };

const fetchActionableTasks = async (): Promise<TaskWithGoal[]> => {
  const { data } = await axios.get('/api/reset/plan');
  return data;
};

// API functions for adding/removing from queue
const updateQueue = ({
  taskId,
  action,
}: {
  taskId: string;
  action: 'add' | 'remove';
}) => {
  if (action === 'add') {
    return axios.post('/api/daily-queue', { taskId });
  }
  // Assumes your API for daily-queue can handle a DELETE request by taskId
  return axios.delete(`/api/daily-queue/${taskId}`);
};

export function StepPlan() {
  const queryClient = useQueryClient();
  const [queuedTaskIds, setQueuedTaskIds] = useState<Set<string>>(new Set());

  const {
    data: tasks,
    isLoading,
    isError,
  } = useQuery<TaskWithGoal[]>({
    queryKey: ['weeklyResetPlan'],
    queryFn: fetchActionableTasks,
  });

  const mutation = useMutation({
    mutationFn: updateQueue,
    onSuccess: (_, { taskId, action }) => {
      // Optimistically update the local state
      setQueuedTaskIds((prev) => {
        const newSet = new Set(prev);
        if (action === 'add') {
          newSet.add(taskId);
        } else {
          newSet.delete(taskId);
        }
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['dailyQueue'] });
    },
    onError: (_, { action }) => toast.error(`Could not ${action} task.`),
  });

  const handleToggleQueue = (task: Task) => {
    const action = queuedTaskIds.has(task.id) ? 'remove' : 'add';
    mutation.mutate({ taskId: task.id, action });
  };

  if (isLoading) return <PlanSkeleton />;
  if (isError)
    return (
      <p className='text-destructive'>Could not load tasks for planning.</p>
    );

  return (
    <div className='text-center'>
      <h2
        tabIndex={-1}
        className='text-3xl font-bold tracking-tight outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm'
      >
        Plan Your Week
      </h2>
      <p className='mt-2 text-muted-foreground'>
        Select your key priorities for the week ahead to populate your focus
        queue.
      </p>

      <div className='mt-8 text-left max-h-[400px] overflow-y-auto p-1 border rounded-lg'>
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => {
            const isQueued = queuedTaskIds.has(task.id);
            return (
              <div
                key={task.id}
                className='p-3 border-b flex items-center justify-between'
              >
                <div>
                  <p className='font-medium'>{task.title}</p>
                  <p className='text-xs text-muted-foreground'>
                    {task.goal.title}
                  </p>
                </div>
                <Button
                  size='sm'
                  variant={isQueued ? 'secondary' : 'outline'}
                  onClick={() => handleToggleQueue(task)}
                  disabled={
                    mutation.isPending && mutation.variables?.taskId === task.id
                  }
                  aria-label={
                    isQueued
                      ? `Remove ${task.title} from queue`
                      : `Add ${task.title} to queue`
                  }
                >
                  {isQueued ? (
                    <Minus className='mr-2 h-4 w-4' />
                  ) : (
                    <Plus className='mr-2 h-4 w-4' />
                  )}
                  {isQueued ? 'Queued' : 'Add to Queue'}
                </Button>
              </div>
            );
          })
        ) : (
          <p className='p-8 text-center text-muted-foreground'>
            You have no pending tasks to plan!
          </p>
        )}
      </div>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className='text-center'>
      <Skeleton className='h-8 w-1/2 mx-auto' />
      <Skeleton className='h-4 w-2/3 mx-auto mt-2' />
      <div className='mt-8 space-y-3 p-1 border rounded-lg'>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className='p-3 border-b flex items-center justify-between'
          >
            <div>
              <Skeleton className='h-5 w-48 mb-2' />
              <Skeleton className='h-3 w-32' />
            </div>
            <Skeleton className='h-9 w-28' />
          </div>
        ))}
      </div>
    </div>
  );
}
