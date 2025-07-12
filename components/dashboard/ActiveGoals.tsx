'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoalProgressBar } from './GoalProgressBar';

// The shape of the goal data passed down from the server component
type ActiveGoal = {
  id: string;
  title: string;
  color: string | null;
  progress: number;
};

interface ActiveGoalsProps {
  goals: ActiveGoal[];
}

export function ActiveGoals({ goals }: ActiveGoalsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Goals</CardTitle>
        <CardDescription>Your current high-level objectives.</CardDescription>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <ScrollArea className='h-64'>
            <div className='space-y-4 pr-4'>
              {goals.map((goal) => (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className='block p-3 rounded-lg hover:bg-accent transition-colors'
                >
                  <div className='flex items-center justify-between mb-1'>
                    <p className='font-semibold text-sm truncate'>
                      {goal.title}
                    </p>
                    <p className='text-sm font-mono text-muted-foreground'>
                      {goal.progress}%
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-2 w-2 rounded-full flex-shrink-0'
                      style={{
                        backgroundColor: goal.color ?? 'hsl(var(--muted))',
                      }}
                    />
                    <GoalProgressBar value={goal.progress} />
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className='text-center text-sm text-muted-foreground py-10'>
            You have no active goals. Create one to get started!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
