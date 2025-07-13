'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type StreakData } from '@/lib/streak-helpers';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Flame, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { SetDailyGoalModal } from './SetDailyGoalModal';

interface UserStatus {
  dailyFocusGoalMinutes: number | null;
}

const fetchUserStatus = async (): Promise<UserStatus> => {
  const { data } = await axios.get('/api/user/status');

  return data;
};

interface StatsCardsProps {
  streakData: StreakData;
  totalFocusTodayInSeconds: number;
}

const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export function StatsCards({
  streakData,
  totalFocusTodayInSeconds,
}: StatsCardsProps) {
  const { currentStreak, longestStreak } = streakData;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: userStatus, isLoading } = useQuery<UserStatus>({
    queryKey: ['userStatus'],
    queryFn: fetchUserStatus,
    staleTime: 5 * 60 * 1000,
  });

  const dailyGoalMinutes = userStatus?.dailyFocusGoalMinutes;

  const dailyGoalSeconds = (dailyGoalMinutes || 0) * 60;
  const progress =
    dailyGoalSeconds > 0
      ? Math.min((totalFocusTodayInSeconds / dailyGoalSeconds) * 100, 100)
      : 0;
  const pieData = [{ value: progress }, { value: Math.max(0, 100 - progress) }];
  const isGoalMet = progress >= 100;

  return (
    <>
      <div className='grid gap-4 md:grid-cols-3'>
        {/* Daily Goal Card */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Daily Focus Goal
            </CardTitle>
            <Target className={cn('h-4 w-4 text-green-500')} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='space-y-2 pt-2'>
                <Skeleton className='h-8 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </div>
            ) : (
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <div className='text-2xl font-bold'>
                    {formatDuration(totalFocusTodayInSeconds)}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {dailyGoalMinutes
                      ? `of ${formatDuration(dailyGoalSeconds)} goal`
                      : 'No goal set'}
                  </p>
                </div>
                {/* This conditional logic now only runs AFTER isLoading is false. */}
                {dailyGoalMinutes ? (
                  <div
                    className='relative h-16 w-16 cursor-pointer'
                    onClick={() => setIsModalOpen(true)}
                  >
                    <PieChart width={64} height={64}>
                      <Pie
                        data={pieData}
                        dataKey='value'
                        innerRadius={22}
                        outerRadius={28}
                        startAngle={90}
                        endAngle={-270}
                        stroke='none'
                      >
                        <Cell
                          fill={isGoalMet ? 'var(--success)' : 'var(--primary)'}
                        />
                        <Cell fill='var(--muted)' />
                      </Pie>
                    </PieChart>
                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                      <span className='text-lg font-bold'>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Target className='mr-2 h-4 w-4' />
                    Set Goal
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current & Longest Streak Cards (Unchanged) */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Current Streak
            </CardTitle>
            <Flame
              className={cn(
                'h-4 w-4',
                currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
              )}
            />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </div>
            <p className='text-xs text-muted-foreground'>
              {currentStreak > 0
                ? 'Keep the momentum going!'
                : 'Start a session to build a streak.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Longest Streak
            </CardTitle>
            <Sparkles
              className={cn(
                'h-4 w-4',
                longestStreak > 0 ? 'text-amber-500' : 'text-muted-foreground'
              )}
            />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </div>
            <p className='text-xs text-muted-foreground'>Your personal best.</p>
          </CardContent>
        </Card>
      </div>

      <SetDailyGoalModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialMinutes={dailyGoalMinutes ?? null}
      />
    </>
  );
}
