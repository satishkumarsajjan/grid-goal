'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// The shape of the task data passed down from the server component
type UpcomingTask = {
  id: string;
  title: string;
  goalTitle: string;
  deadline: Date | null;
};

interface UpcomingDeadlinesProps {
  tasks: UpcomingTask[];
}

export function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
  const getUrgencyColor = (deadline: Date): string => {
    const now = new Date();
    const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);
    if (daysUntil <= 3) return 'text-destructive';
    if (daysUntil <= 7) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>On the Horizon</CardTitle>
        <CardDescription>Your nearest upcoming deadlines.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ul className='space-y-4'>
            {tasks.map((task) => (
              <li key={task.id} className='flex items-start gap-3'>
                <Clock className='h-4 w-4 mt-1 text-muted-foreground' />
                <div className='flex-1'>
                  <p className='font-medium text-sm leading-tight'>
                    {task.title}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {task.goalTitle}
                  </p>
                </div>
                {task.deadline && (
                  <span
                    className={cn(
                      'text-xs font-semibold flex-shrink-0',
                      getUrgencyColor(task.deadline)
                    )}
                  >
                    {formatDistanceToNow(task.deadline, { addSuffix: true })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-center text-sm text-muted-foreground py-6'>
            No upcoming deadlines in the next two weeks.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
