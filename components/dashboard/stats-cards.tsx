'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Target, Clock } from 'lucide-react';
import { type Streak } from '@/lib/streak-helpers'; // We need to export this type

// Helper to format seconds into a more readable format, e.g., "1h 35m"
const formatDuration = (totalSeconds: number) => {
  if (totalSeconds < 60) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m`;
  return result.trim();
};

interface StatsCardsProps {
  streakData?: { currentStreak: number; todayInStreak: boolean };
  totalFocusToday?: number;
}

export function StatsCards({
  streakData,
  totalFocusToday = 0,
}: StatsCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Current Streak</CardTitle>
          <Flame className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {streakData?.currentStreak ?? 0} days
          </div>
          <p className='text-xs text-muted-foreground'>
            {streakData?.todayInStreak
              ? "You've focused today. Keep it up!"
              : 'Log a session today to continue.'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Today's Focus</CardTitle>
          <Clock className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatDuration(totalFocusToday)}
          </div>
          <p className='text-xs text-muted-foreground'>
            Total time focused today.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Goals In Progress
          </CardTitle>
          <Target className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          {/* Note: This is a placeholder for now. We would need to fetch this data separately. */}
          <div className='text-2xl font-bold'>--</div>
          <p className='text-xs text-muted-foreground'>
            Number of active goals.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
