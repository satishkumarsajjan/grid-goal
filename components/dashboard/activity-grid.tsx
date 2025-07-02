'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ActivityGridProps {
  activityData: Record<string, number>; // e.g., { "2024-05-21": 3600 }
}

// Helper to generate the days for the grid display
const generateGridDays = () => {
  const days = [];
  const today = new Date();
  // Go back roughly 6 months to fill the grid
  const startDate = new Date();
  startDate.setDate(today.getDate() - 180);

  // Align start date to the previous Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  let currentDate = startDate;
  while (currentDate <= today) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
};

// Helper to determine the color intensity based on activity
const getColorClass = (seconds: number | undefined) => {
  if (!seconds || seconds === 0) return 'bg-gray-200 dark:bg-gray-800';
  const hours = seconds / 3600;
  if (hours < 1) return 'bg-green-200 dark:bg-green-900';
  if (hours < 2) return 'bg-green-400 dark:bg-green-700';
  if (hours < 4) return 'bg-green-600 dark:bg-green-500';
  return 'bg-green-800 dark:bg-green-400';
};

export function ActivityGrid({ activityData }: ActivityGridProps) {
  const gridDays = generateGridDays();

  return (
    <TooltipProvider>
      <div className='mt-8'>
        <h3 className='text-lg font-semibold mb-2'>Your Activity</h3>
        <div className='grid grid-cols-53 grid-rows-7 grid-flow-col gap-1'>
          {/* 
              This uses CSS Grid to create the GitHub-style layout. 
              The `grid-flow-col` is the key part.
            */}
          {gridDays.map((day, index) => {
            const dateString = format(day, 'yyyy-MM-dd');
            const activitySeconds = activityData[dateString];

            return (
              <Tooltip key={index} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'h-3 w-3 rounded-sm',
                      getColorClass(activitySeconds)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-sm font-medium'>
                    {activitySeconds
                      ? `${Math.floor(activitySeconds / 60)} minutes`
                      : 'No activity'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {format(day, 'MMMM d, yyyy')}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
