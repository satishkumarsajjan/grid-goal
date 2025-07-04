'use client';

import { type Task } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

type TaskWithGoal = Task & { goal: { title: string } };

const fetchActionableTasks = async (): Promise<TaskWithGoal[]> => {
  const { data } = await axios.get('/api/reset/plan');
  return data;
};

const addTaskToQueue = (taskId: string) =>
  axios.post('/api/daily-queue', { taskId });

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
    mutationFn: addTaskToQueue,
    onSuccess: (data, taskId) => {
      setQueuedTaskIds((prev) => new Set(prev).add(taskId));
      // Invalidate the main dashboard queue query so it's fresh after the reset
      queryClient.invalidateQueries({ queryKey: ['dailyQueue'] });
    },
    onError: () => toast.error('Could not add task to queue.'),
  });

  if (isLoading) return <PlanSkeleton />;
  if (isError)
    return (
      <p className='text-destructive'>Could not load tasks for planning.</p>
    );

  return (
    <div className='text-center'>
      <h2 className='text-3xl font-bold tracking-tight'>Plan Your Week</h2>
      <p className='mt-2 text-muted-foreground'>
        Select your key priorities for the week ahead to populate your focus
        queue.
      </p>

      <div className='mt-8 text-left max-h-[400px] overflow-y-auto p-1 border rounded-lg'>
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
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
                variant={queuedTaskIds.has(task.id) ? 'secondary' : 'outline'}
                onClick={() => mutation.mutate(task.id)}
                disabled={queuedTaskIds.has(task.id) || mutation.isPending}
              >
                {queuedTaskIds.has(task.id) ? (
                  <Check className='mr-2 h-4 w-4' />
                ) : (
                  <ArrowRight className='mr-2 h-4 w-4' />
                )}
                {queuedTaskIds.has(task.id) ? 'Queued' : 'Add to Queue'}
              </Button>
            </div>
          ))
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
