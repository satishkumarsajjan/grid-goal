import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalWithProgressAndChildren } from '@/lib/types';
import { type Goal } from '@prisma/client';
import Link from 'next/link';
import { DeadlineBadge } from './deadline-badge';

export type GoalWithProgress = Goal & {
  _count: {
    tasks: number;
    completedTasks: number;
  };
};

interface GoalCardProps {
  goal: GoalWithProgressAndChildren;
}

export function GoalCard({ goal }: GoalCardProps) {
  const totalTasks = goal.totalTasks;
  const completedTasks = goal.completedTasks;
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

        <CardContent className='flex-grow pb-4'>
          {goal.deadline && (
            <div className='flex'>
              <DeadlineBadge deadline={goal.deadline} />
            </div>
          )}
        </CardContent>

        <CardFooter className='flex flex-col items-start'>
          <div className='flex w-full justify-between text-xs text-muted-foreground mb-1'>
            <span>Progress</span>
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
