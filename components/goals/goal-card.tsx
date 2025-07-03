import Link from 'next/link';
import { type GoalWithTasksCount } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Assuming you have this
import { Skeleton } from '@/components/ui/skeleton';
import { type Goal } from '@prisma/client';

export type GoalWithProgress = Goal & {
  _count: {
    tasks: number;
    completedTasks: number;
  };
};

interface GoalCardProps {
  goal: GoalWithProgress;
}

export function GoalCard({ goal }: GoalCardProps) {
  // FIX: Use the new counts passed from the server
  const totalTasks = goal._count.tasks;
  const completedTasks = goal._count.completedTasks;

  // The progress calculation now works correctly.
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Link
      href={`/goals/${goal.id}`}
      className='block hover:shadow-lg transition-shadow rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    >
      <Card className='h-full flex flex-col'>
        <CardHeader>
          <CardTitle className='truncate'>{goal.title}</CardTitle>
          {goal.description && (
            <CardDescription className='line-clamp-2 h-[40px]'>
              {goal.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className='flex-grow'>
          {/* This space is still available for future content */}
        </CardContent>
        <CardFooter className='flex flex-col items-start'>
          <div className='flex w-full justify-between text-xs text-muted-foreground mb-1'>
            <span>Progress</span>
            {/* Display the correct counts */}
            <span>{`${completedTasks} / ${totalTasks} tasks`}</span>
          </div>
          <Progress
            value={progress}
            aria-label={`${Math.round(progress)}% complete`}
          />
        </CardFooter>
      </Card>
    </Link>
  );
}
// A skeleton component to provide a better loading experience
export function GoalCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-3/4' />
        <Skeleton className='h-4 w-full mt-2' />
        <Skeleton className='h-4 w-5/6' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-10 w-full' />
      </CardContent>
      <CardFooter>
        <Skeleton className='h-4 w-full' />
      </CardFooter>
    </Card>
  );
}
