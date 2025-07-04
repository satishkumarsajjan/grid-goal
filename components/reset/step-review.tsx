'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type Goal, GoalStatus } from '@prisma/client';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Archive, PauseCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const fetchGoalsToReview = async (): Promise<Goal[]> => {
  const { data } = await axios.get('/api/reset/review');
  return data;
};

const updateGoalStatus = async ({
  goalId,
  status,
}: {
  goalId: string;
  status: GoalStatus;
}) => {
  const { data } = await axios.patch(`/api/goals/${goalId}`, { status });
  return data;
};

export function StepReview() {
  const queryClient = useQueryClient();
  const {
    data: goals,
    isLoading,
    isError,
  } = useQuery<Goal[]>({
    queryKey: ['weeklyResetReview'],
    queryFn: fetchGoalsToReview,
  });

  const mutation = useMutation({
    mutationFn: updateGoalStatus,
    onSuccess: () => {
      // Invalidate both the review query AND the main goals query
      // so the navigator updates after the reset is complete.
      queryClient.invalidateQueries({ queryKey: ['weeklyResetReview'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => toast.error('Could not update goal status.'),
  });

  const handleStatusUpdate = (goalId: string, status: GoalStatus) => {
    mutation.mutate({ goalId, status });
  };

  if (isLoading) {
    return <ReviewSkeleton />;
  }
  if (isError) {
    return (
      <p className='text-destructive'>Could not load your goals for review.</p>
    );
  }
  if (!goals || goals.length === 0) {
    return (
      <div className='text-center'>
        <h2 className='text-3xl font-bold tracking-tight'>Review Your Goals</h2>
        <p className='mt-4 text-muted-foreground'>
          You have no active goals to review. Ready to plan?
        </p>
      </div>
    );
  }

  return (
    <div className='text-center'>
      <h2 className='text-3xl font-bold tracking-tight'>Review Your Goals</h2>
      <p className='mt-2 text-muted-foreground'>
        Decide what to keep, pause, or archive for the week ahead.
      </p>

      <div className='mt-8 space-y-3 text-left'>
        {goals.map((goal) => (
          <div
            key={goal.id}
            className='p-4 border rounded-lg flex items-center justify-between bg-accent/50'
          >
            <div>
              <p
                className={cn(
                  'font-semibold',
                  goal.status === 'PAUSED' &&
                    'text-muted-foreground line-through'
                )}
              >
                {goal.title}
              </p>
              <p className='text-xs text-muted-foreground'>
                Status: {goal.status}
              </p>
            </div>
            <div className='flex gap-2'>
              {goal.status === 'ACTIVE' ? (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleStatusUpdate(goal.id, GoalStatus.PAUSED)}
                >
                  <PauseCircle className='mr-2 h-4 w-4' /> Pause
                </Button>
              ) : (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleStatusUpdate(goal.id, GoalStatus.ACTIVE)}
                >
                  <Play className='mr-2 h-4 w-4' /> Resume
                </Button>
              )}
              <Button
                variant='destructive'
                size='sm'
                onClick={() => handleStatusUpdate(goal.id, GoalStatus.ARCHIVED)}
              >
                <Archive className='mr-2 h-4 w-4' /> Archive
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className='text-center'>
      <Skeleton className='h-8 w-1/2 mx-auto' />
      <Skeleton className='h-4 w-2/3 mx-auto mt-2' />
      <div className='mt-8 space-y-3'>
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
      </div>
    </div>
  );
}
