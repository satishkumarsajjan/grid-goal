'use client';

import { Button } from '@/components/ui/button';
import { type DailyQueueItem, type Task } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { isToday } from 'date-fns';
import { CalendarCheck2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { DailyQueueItemWithTaskAndGoal } from '@/lib/types';
import { StatusIcon } from '@/lib/status-icon';

// Combine the types for easier use

// --- API Functions ---
const fetchQueue = async (): Promise<DailyQueueItemWithTaskAndGoal[]> => {
  const { data } = await axios.get('/api/daily-queue?includeGoal=true');
  return data;
};
const removeItem = async (itemId: string) =>
  axios.delete(`/api/daily-queue/${itemId}`);
const bulkAction = async (action: 'CLEAR_ALL' | 'RESET_DATES') =>
  axios.post('/api/daily-queue/bulk-actions', { action });

// --- Main Component ---
export function DailyFocusQueue() {
  const queryClient = useQueryClient();

  const {
    data: items,
    isLoading,
    isError,
  } = useQuery<DailyQueueItemWithTaskAndGoal[]>({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
  });

  // --- Mutations ---
  const removeItemMutation = useMutation({
    mutationFn: removeItem,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['dailyQueue'] }),
  });

  const bulkActionMutation = useMutation({
    mutationFn: bulkAction,
    onSuccess: (data, action) => {
      toast.success(
        action === 'CLEAR_ALL'
          ? 'Queue cleared!'
          : "Yesterday's tasks carried over!"
      );
      queryClient.invalidateQueries({ queryKey: ['dailyQueue'] });
    },
    onError: () => toast.error('Something went wrong.'),
  });

  // --- Logic for "Yesterday's Review" ---
  const hasItems = items && items.length > 0;
  // The queue is from yesterday if it has items AND none of them were created today.
  const isYesterdayQueue =
    hasItems && !items.some((item) => isToday(new Date(item.createdAt)));

  const renderContent = () => {
    if (isLoading) return <QueueSkeleton />;
    if (isError)
      return (
        <p className='text-sm text-destructive'>Could not load focus queue.</p>
      );
    if (!hasItems) {
      return (
        <div className='text-center py-4'>
          <p className='text-sm font-medium'>Your focus queue is empty.</p>
          <p className='text-xs text-muted-foreground'>
            Add tasks from your goals to plan your day.
          </p>
        </div>
      );
    }

    // --- The "Yesterday's Review" UI ---
    if (isYesterdayQueue) {
      return (
        <div className='p-4 bg-accent/50 rounded-lg'>
          <h4 className='font-semibold text-sm'>Review Yesterday's Plan</h4>
          <p className='text-xs text-muted-foreground mb-4'>
            You have unfinished tasks from yesterday.
          </p>
          <div className='flex gap-2'>
            <Button
              size='sm'
              onClick={() => bulkActionMutation.mutate('RESET_DATES')}
            >
              <CalendarCheck2 className='mr-2 h-4 w-4' /> Keep for Today
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => bulkActionMutation.mutate('CLEAR_ALL')}
            >
              Clear All
            </Button>
          </div>
        </div>
      );
    }

    // --- The Standard Queue List UI ---
    return (
      <ul className='space-y-1.5'>
        {' '}
        {/* Slightly reduced gap for a tighter list */}
        {items.map((item) => (
          <li
            key={item.id}
            // Added focus-within to the group for keyboard accessibility
            // Added smooth transitions for background color
            className='group flex items-center gap-3 rounded-lg p-3 transition-colors duration-150 hover:bg-accent'
          >
            {/* The StatusIcon is now outside the text block for better alignment control */}
            {StatusIcon({ status: item.task.status })}

            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-foreground truncate'>
                {item.task.title}
              </p>
              {item.task.goal && (
                // Added a subtle top margin for better separation
                <p className='text-xs text-muted-foreground truncate pt-0.5'>
                  {item.task.goal.title}
                </p>
              )}
            </div>

            <Button
              variant='ghost'
              size='icon'
              // Increased size for easier clicking (better Fitts's Law)
              // Added smooth transitions for opacity and transform
              // The button will now also show when the list item is focused via keyboard
              className='h-7 w-7 shrink-0 rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100'
              onClick={() => removeItemMutation.mutate(item.id)}
              // CRITICAL: Added aria-label for accessibility
              aria-label={`Remove "${item.task.title}" from queue`}
            >
              <X className='h-4 w-4' />
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className='p-4 border rounded-lg bg-card h-full'>
      <h3 className='text-lg font-bold mb-4'>Today's Focus</h3>
      {renderContent()}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-5 w-3/4' />
      <Skeleton className='h-5 w-full' />
      <Skeleton className='h-5 w-5/6' />
    </div>
  );
}
