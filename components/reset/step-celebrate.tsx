'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Award, Clock, Smile, Meh, Frown } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface CelebrateData {
  totalSeconds: number;
  totalSessions: number;
  vibeCounts: { FLOW: number; NEUTRAL: number; STRUGGLE: number };
}
const fetchCelebrateData = async (): Promise<CelebrateData> => {
  const { data } = await axios.get('/api/reset/celebrate');
  return data;
};
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export function StepCelebrate() {
  const { data, isLoading, isError } = useQuery<CelebrateData>({
    queryKey: ['weeklyResetCelebrate'],
    queryFn: fetchCelebrateData,
  });

  if (isLoading) return <CelebrateSkeleton />;
  if (isError || !data)
    return (
      <p className='text-destructive'>Could not load your weekly summary.</p>
    );

  return (
    <div className='text-center'>
      <h2
        tabIndex={-1}
        className='text-3xl font-bold tracking-tight outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm'
      >
        Last Week&apos;s Wins
      </h2>
      <p className='mt-2 text-muted-foreground'>
        Let&apos;s celebrate the effort you put in over the last 7 days.
      </p>
      <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center'>
        <StatCard
          icon={<Clock className='h-6 w-6 text-primary' />}
          label='Total Focus Time'
          value={formatDuration(data.totalSeconds)}
        />
        <StatCard
          icon={<Award className='h-6 w-6 text-primary' />}
          label='Focus Sessions'
          value={`${data.totalSessions}`}
        />
        <VibeStatCard vibes={data.vibeCounts} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='p-4 bg-accent/50 rounded-lg'>
      <div className='mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10'>
        {icon}
      </div>
      <h3 className='mt-4 text-lg font-semibold'>{value}</h3>
      <p className='text-sm text-muted-foreground'>{label}</p>
    </div>
  );
}

function VibeStatCard({ vibes }: { vibes: CelebrateData['vibeCounts'] }) {
  return (
    <div className='p-4 bg-accent/50 rounded-lg'>
      <div className='mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10'>
        <Smile className='h-6 w-6 text-primary' />
      </div>
      <h3 className='mt-4 text-lg font-semibold'>Session Vibe</h3>
      <div className='text-xs text-muted-foreground flex justify-center gap-4'>
        <span className='flex items-center gap-1'>
          <Smile className='h-3 w-3 text-green-500' aria-hidden='true' />
          <span className='sr-only'>Flow sessions:</span>
          {vibes.FLOW}
        </span>
        <span className='flex items-center gap-1'>
          <Meh className='h-3 w-3 text-yellow-500' aria-hidden='true' />
          <span className='sr-only'>Neutral sessions:</span>
          {vibes.NEUTRAL}
        </span>
        <span className='flex items-center gap-1'>
          <Frown className='h-3 w-3 text-red-500' aria-hidden='true' />
          <span className='sr-only'>Struggle sessions:</span>
          {vibes.STRUGGLE}
        </span>
      </div>
    </div>
  );
}

function CelebrateSkeleton() {
  return (
    <div className='text-center'>
      <Skeleton className='h-8 w-2/3 mx-auto' />
      <Skeleton className='h-4 w-1/2 mx-auto mt-2' />
      <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Skeleton className='h-36 w-full' />
        <Skeleton className='h-36 w-full' />
        <Skeleton className='h-36 w-full' />
      </div>
    </div>
  );
}
