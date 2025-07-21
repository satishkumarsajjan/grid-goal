'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type TaskWithGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type QueueItem = { id: string; task: TaskWithGoal };

const fetchQueue = async (): Promise<QueueItem[]> => {
  const { data } = await axios.get('/api/daily-queue?includeGoal=true');
  return data;
};

const removeFromQueue = async (queueItemId: string) => {
  return axios.delete(`/api/daily-queue/${queueItemId}`);
};

export function DailyFocusQueue() {
  const queryClient = useQueryClient();

  const {
    data: queue,
    isLoading,
    isError,
  } = useQuery<QueueItem[]>({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
  });

  const mutation = useMutation({
    mutationFn: removeFromQueue,
    onMutate: async (removedQueueItemId: string) => {
      await queryClient.cancelQueries({ queryKey: ['dailyQueue'] });
      const previousQueue = queryClient.getQueryData<QueueItem[]>([
        'dailyQueue',
      ]);

      // Optimistically remove the item using its unique queueItemId
      queryClient.setQueryData<QueueItem[]>(['dailyQueue'], (old) =>
        old ? old.filter((item) => item.id !== removedQueueItemId) : []
      );

      toast.success('Task removed from queue.');
      return { previousQueue };
    },
    onError: (err, removedQueueItemId, context) => {
      toast.error('Failed to remove task. Restoring queue.');
      if (context?.previousQueue) {
        queryClient.setQueryData(['dailyQueue'], context.previousQueue);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyQueue'] });
    },
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
        {queue.map((item) => (
          <FocusQueueItem
            key={item.id}
            task={item.task}
            onRemove={() => mutation.mutate(item.id)}
            isPending={mutation.isPending && mutation.variables === item.id}
          />
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
      <CardContent className='flex-1 flex flex-col gap-4 overflow-hidden'>
        <ScrollArea className='flex-1 -mx-4 px-4'>{renderContent()}</ScrollArea>
      </CardContent>
    </Card>
  );
}

function QueueSkeleton() {
  /* ... unchanged ... */ return (
    <div className='space-y-3'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
    </div>
  );
}

interface FocusQueueItemProps {
  task: TaskWithGoal;
  onRemove: () => void;
  isPending: boolean;
}
function FocusQueueItem({ task, onRemove, isPending }: FocusQueueItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between gap-2 p-2 border rounded-md bg-background text-sm transition-opacity',
        isPending && 'opacity-50'
      )}
    >
      <div className='flex-1 min-w-0'>
        <p className='font-medium truncate'>{task.title}</p>
        <p className='text-xs text-muted-foreground truncate'>
          {task.goal.title}
        </p>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
        onClick={onRemove}
        disabled={isPending}
        aria-label={`Remove ${task.title} from queue`}
      >
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
}
