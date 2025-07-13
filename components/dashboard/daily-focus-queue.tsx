'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ListTodo } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type TaskWithGoal } from '@/lib/types'; // Assuming this type exists

import { QuickAddTaskForm } from './QuickAddTaskForm'; // NEW: Import the form

// Assuming this type is defined for the API response
type QueueItem = { task: TaskWithGoal };

const fetchQueue = async (): Promise<QueueItem[]> => {
  const { data } = await axios.get('/api/daily-queue?includeGoal=true');
  return data;
};

export function DailyFocusQueue() {
  const {
    data: queue,
    isLoading,
    isError,
  } = useQuery<QueueItem[]>({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
  });

  const renderContent = () => {
    if (isLoading) return <QueueSkeleton />;
    if (isError)
      return (
        <p className='text-sm text-destructive text-center p-4'>
          Could not load focus queue.
        </p>
      );
    if (!queue || queue.length === 0) {
      return (
        <div className='text-center text-sm text-muted-foreground p-6'>
          <p>Your focus queue is empty.</p>
          <p className='text-xs mt-1'>
            Add tasks from a goal to start your day.
          </p>
        </div>
      );
    }
    return (
      <div className='space-y-2'>
        {queue.map(({ task }) => (
          <FocusQueueItem key={task.id} task={task} />
        ))}
      </div>
    );
  };

  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <CardTitle>Daily Focus Queue</CardTitle>
        <CardDescription>Your prioritized tasks for today.</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col gap-4'>
        <div className='flex-1 overflow-y-auto pr-1'>{renderContent()}</div>
      </CardContent>
    </Card>
  );
}

function QueueSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
    </div>
  );
}

function FocusQueueItem({ task }: { task: TaskWithGoal }) {
  // This is a placeholder implementation
  return (
    <div className='p-2 border rounded-md bg-background text-sm'>
      <p className='font-medium truncate'>{task.title}</p>
      <p className='text-xs text-muted-foreground truncate'>
        {task.goal.title}
      </p>
    </div>
  );
}
