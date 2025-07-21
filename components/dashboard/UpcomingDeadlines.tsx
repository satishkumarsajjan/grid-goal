'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Target } from 'lucide-react';
import Link from 'next/link';
import { type Goal } from '@prisma/client'; // Import the base Goal type

// The props interface now expects an array of Goals
interface UpcomingDeadlinesProps {
  goals: Goal[];
}

export function UpcomingDeadlines({ goals }: UpcomingDeadlinesProps) {
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
        <CardDescription>Your nearest upcoming goal deadlines.</CardDescription>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <ul className='space-y-1'>
            {goals.map((goal) => (
              <li key={goal.id}>
                <Link
                  href={`/goals/${goal.id}`}
                  className='block p-3 -m-3 rounded-lg hover:bg-accent transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    {/* Use a Target icon for goals */}
                    <Target className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-sm leading-tight truncate'>
                        {goal.title}
                      </p>
                    </div>
                    {goal.deadline && (
                      <span
                        className={cn(
                          'text-xs font-semibold flex-shrink-0',
                          getUrgencyColor(goal.deadline)
                        )}
                      >
                        {formatDistanceToNow(goal.deadline, {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-center text-sm text-muted-foreground py-6'>
            No upcoming goal deadlines in the next two weeks.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
