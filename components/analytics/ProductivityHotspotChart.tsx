'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { BrainCircuit } from 'lucide-react';

import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

// The data shape from the API endpoint.
// Exporting this from the route file and importing here is best practice.
type ProductivityHotspotData = {
  heatmap: number[][];
  maxValue: number;
};

// --- Helper Functions & Constants ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Utility to format seconds into a concise, human-readable string for the tooltip.
const formatSeconds = (seconds: number): string => {
  if (seconds < 1) return 'No focus';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : ''].filter(Boolean).join(' ');
};

const getBackgroundColor = (value: number, maxValue: number): string => {
  if (value === 0 || maxValue === 0) return 'bg-muted/50';
  const intensity = Math.min(value / maxValue, 1);

  if (intensity < 0.01) return 'bg-muted/50';
  if (intensity < 0.25) return 'bg-primary/20';
  if (intensity < 0.5) return 'bg-primary/40';
  if (intensity < 0.75) return 'bg-primary/60';
  return 'bg-primary/80';
};

// --- API Fetcher ---
const fetchHotspotData = async (
  startDate: Date,
  endDate: Date
): Promise<ProductivityHotspotData> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const { data } = await axios.get(
    `/api/analytics/productivity-hotspot?${params.toString()}`
  );
  return data;
};

// --- Main Component ---
export function ProductivityHotspotChart() {
  // Read the date range directly from the global Zustand store.
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const { data, isLoading, isError, error } = useQuery<ProductivityHotspotData>(
    {
      // The queryKey now includes the global startDate and endDate.
      // TanStack Query will automatically refetch when these values change.
      queryKey: ['productivityHotspot', { startDate, endDate }],
      queryFn: () => fetchHotspotData(startDate, endDate),
      // Keep previous data visible while new data is loading for a smoother UX.
      placeholderData: (previousData) => previousData,
    }
  );

  const renderGrid = () => {
    if (isLoading) return <HotspotSkeleton />;
    if (isError) {
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          {axios.isAxiosError(error)
            ? error.response?.data?.error || error.message
            : 'Could not load heatmap data.'}
        </p>
      );
    }
    if (!data || data.maxValue === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <BrainCircuit className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Not Enough Data</p>
          <p className='text-sm text-muted-foreground'>
            Track focus sessions in this period to discover your peak times.
          </p>
        </div>
      );
    }

    return (
      <TooltipProvider delayDuration={0}>
        <div className='grid grid-cols-7 gap-1.5 p-1'>
          {DAYS.map((day) => (
            <div
              key={day}
              className='text-center text-xs font-medium text-muted-foreground'
            >
              {day}
            </div>
          ))}
          {Array.from({ length: 24 * 7 }).map((_, index) => {
            const dayIndex = index % 7;
            const hourIndex = Math.floor(index / 7);
            const value = data.heatmap[dayIndex][hourIndex];
            const hourLabel = format(new Date(2000, 0, 1, hourIndex), 'ha');

            return (
              <Tooltip key={`${dayIndex}-${hourIndex}`}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-4 w-full rounded-sm ${getBackgroundColor(
                      value,
                      data.maxValue
                    )}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-sm font-semibold'>
                    {formatSeconds(value)} on {DAYS[dayIndex]}s around{' '}
                    {hourLabel}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Productivity Hotspot</CardTitle>
        <CardDescription>
          Focus intensity by day and hour from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderGrid()}</CardContent>
    </Card>
  );
}

// --- Skeleton Component ---
function HotspotSkeleton() {
  return (
    <div className='grid grid-cols-7 gap-1.5 p-1'>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={`day-skel-${i}`} className='h-4 w-8 mx-auto' />
      ))}
      {Array.from({ length: 24 * 7 }).map((_, i) => (
        <Skeleton key={`cell-skel-${i}`} className='h-4 w-full' />
      ))}
    </div>
  );
}
