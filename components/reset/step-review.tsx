'use client';

import { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { CheckCircle2, PieChart, Trophy } from 'lucide-react';
import { type ReviewData } from '@/app/api/reset/review/route';

const fetchReviewData = async (): Promise<ReviewData> => {
  const { data } = await axios.get('/api/reset/review');
  return data;
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '<1m';
};

export const StepReview = forwardRef<HTMLHeadingElement>((props, ref) => {
  const { data, isLoading, isError } = useQuery<ReviewData>({
    queryKey: ['weeklyResetReview'],
    queryFn: fetchReviewData,
  });

  if (isLoading) return <ReviewSkeleton />;
  if (isError || !data)
    return (
      <p className='text-destructive'>Could not load your weekly review.</p>
    );

  const hasAnyData =
    data.completedGoals.length > 0 ||
    data.completedTasks.length > 0 ||
    data.timeByCategory.length > 0;

  return (
    <div className='text-center'>
      <h2
        ref={ref}
        tabIndex={-1}
        className='text-3xl font-bold tracking-tight outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm'
      >
        Review Your Week
      </h2>
      <p className='mt-2 text-muted-foreground'>
        Look back at what you accomplished and where you struggled.
      </p>

      <ScrollArea className='mt-8 text-left max-h-[400px]'>
        {hasAnyData ? (
          <div className='space-y-6 p-1'>
            {/* Section 1: Goals Completed */}
            {data.completedGoals.length > 0 && (
              <ReviewSection icon={Trophy} title='Goals Completed'>
                {data.completedGoals.map((goal) => (
                  <p key={goal.id} className='text-sm font-medium'>
                    - {goal.title}
                  </p>
                ))}
              </ReviewSection>
            )}

            {/* Section 2: Tasks Completed */}
            {data.completedTasks.length > 0 && (
              <ReviewSection icon={CheckCircle2} title='Tasks Completed'>
                {data.completedTasks.map((task) => (
                  <div key={task.id} className='text-sm'>
                    <p className='font-medium'>- {task.title}</p>
                    <p className='text-xs text-muted-foreground pl-4'>
                      {task.goal.title}
                    </p>
                  </div>
                ))}
              </ReviewSection>
            )}

            {/* Section 3: Time by Category */}
            {data.timeByCategory.length > 0 && (
              <ReviewSection icon={PieChart} title='Time by Category'>
                {data.timeByCategory.map((cat) => (
                  <div
                    key={cat.name}
                    className='flex justify-between items-center text-sm'
                  >
                    <span className='font-medium'>{cat.name}</span>
                    <span className='font-mono text-muted-foreground'>
                      {formatDuration(cat.totalSeconds)}
                    </span>
                  </div>
                ))}
              </ReviewSection>
            )}
          </div>
        ) : (
          <p className='text-center text-muted-foreground p-8'>
            No completed goals or tasks from the last week to review.
          </p>
        )}
      </ScrollArea>
    </div>
  );
});
StepReview.displayName = 'StepReview';

// Helper component for consistent section styling
function ReviewSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className='flex items-center text-lg font-semibold mb-3'>
        <Icon className='h-5 w-5 mr-3 text-primary' />
        {title}
      </h3>
      <div className='pl-8 space-y-2 border-l-2 ml-2.5'>{children}</div>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className='text-center'>
      <Skeleton className='h-8 w-1/2 mx-auto' />
      <Skeleton className='h-4 w-2/3 mx-auto mt-2' />
      <div className='mt-8 space-y-6'>
        <div>
          <Skeleton className='h-6 w-1/3 mb-3' />
          <div className='pl-8 space-y-2'>
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-4/5' />
          </div>
        </div>
        <div>
          <Skeleton className='h-6 w-1/3 mb-3' />
          <div className='pl-8 space-y-2'>
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-3/4' />
          </div>
        </div>
      </div>
    </div>
  );
}
