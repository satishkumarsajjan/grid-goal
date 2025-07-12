'use client';

import { Flame, Activity, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type StreakData } from '@/lib/streak-helpers';

interface StatsCardsProps {
  streakData: StreakData;
  totalFocusTodayInSeconds: number;
}

const formatDuration = (seconds: number) => {
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

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {/* Today's Focus Card */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Today's Focus</CardTitle>
          <Activity className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatDuration(totalFocusTodayInSeconds)}
          </div>
          <p className='text-xs text-muted-foreground'>
            {totalFocusTodayInSeconds > 0
              ? 'Great start to the day!'
              : 'Ready to start your first session?'}
          </p>
        </CardContent>
      </Card>

      {/* Current Streak Card */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Current Streak</CardTitle>
          <Flame className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </div>
          <p className='text-xs text-muted-foreground'>
            {currentStreak > 0
              ? 'Keep the momentum going!'
              : 'Complete a session to start a new streak.'}
          </p>
        </CardContent>
      </Card>

      {/* Longest Streak Card */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Longest Streak</CardTitle>
          <Sparkles className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </div>
          <p className='text-xs text-muted-foreground'>Your personal best.</p>
        </CardContent>
      </Card>
    </div>
  );
}
