'use client';

import { type PausePeriod } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format, isBefore, startOfToday } from 'date-fns'; // Import date-fns helpers
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '@/lib/utils';

const deletePeriod = (periodId: string) =>
  axios.delete(`/api/pause-periods/${periodId}`);

export function VacationListItem({ period }: { period: PausePeriod }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deletePeriod,
    onSuccess: () => {
      toast.success('Scheduled break removed.');
      // Invalidate both pausePeriods and streakData on the dashboard for immediate feedback
      queryClient.invalidateQueries({ queryKey: ['pausePeriods'] });
      queryClient.invalidateQueries({ queryKey: ['streakData'] });
    },
    onError: (error: unknown) => {
      // Type guard for Axios errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response?.status === 400) {
          toast.error('Cannot delete a past break.', {
            description: 'This is to preserve your streak history.',
          });
        } else {
          toast.error('Failed to remove break.');
        }
      } else {
        toast.error('Failed to remove break.');
      }
    },
  });

  // --- THIS IS THE FIX ---
  // Determine if the pause period has already ended.
  const isPast = isBefore(period.endDate, startOfToday());

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 bg-card rounded-md border',
        isPast && 'opacity-60' // Visually deemphasize past periods
      )}
    >
      <div>
        <p className='text-sm font-medium'>
          {format(new Date(period.startDate), 'MMMM d, yyyy')} -{' '}
          {format(new Date(period.endDate), 'MMMM d, yyyy')}
        </p>
        {isPast && <p className='text-xs text-muted-foreground'>Completed</p>}
      </div>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Wrap the button in a span to allow the tooltip to work even when disabled */}
            <span tabIndex={isPast ? 0 : -1}>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-destructive'
                onClick={() => mutation.mutate(period.id)}
                // Disable the button if the period is in the past or a mutation is ongoing
                disabled={isPast || mutation.isPending}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {isPast ? (
              <p>Past breaks cannot be deleted.</p>
            ) : (
              <p>Remove scheduled break</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
