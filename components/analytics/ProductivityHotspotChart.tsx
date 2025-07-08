'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { BrainCircuit } from 'lucide-react';

import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { InsightTooltip } from './InsightTooltip';

type PeakTime = { day: number; hour: number } | null;
type ProductivityHotspotData = {
  heatmap: number[][];
  maxValue: number;
  peakTime: PeakTime;
  totalHours: number;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_LABELS = ['12AM', '6AM', '12PM', '6PM'];

const formatSecondsForTooltip = (seconds: number): string => {
  if (seconds < 1) return 'No focus time';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length > 0 ? parts.join(' ') : '< 1m';
};

const getBackgroundColor = (value: number, maxValue: number): string => {
  if (value === 0 || maxValue === 0) return 'bg-muted/30';
  const intensity = Math.min(value / maxValue, 1);
  if (intensity < 0.01) return 'bg-muted/30';
  if (intensity < 0.25) return 'bg-primary/20';
  if (intensity < 0.5) return 'bg-primary/40';
  if (intensity < 0.75) return 'bg-primary/60';
  return 'bg-primary/80';
};

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

export function ProductivityHotspotChart() {
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const { data, isLoading, isError } = useQuery<ProductivityHotspotData>({
    queryKey: ['productivityHotspot', { startDate, endDate }],
    queryFn: () => fetchHotspotData(startDate, endDate),
    placeholderData: (previousData) => previousData,
  });

  const peakTimeSummary = data?.peakTime
    ? `Your peak focus time is typically on ${
        DAYS[data.peakTime.day]
      }s around ${format(new Date(2000, 0, 1, data.peakTime.hour), 'ha')}.`
    : 'Track more time to discover your peak productivity patterns.';

  const screenReaderSummary = data
    ? `Productivity heatmap from ${format(startDate, 'MMM d')} to ${format(
        endDate,
        'MMM d'
      )}. Total focus time was ${data.totalHours.toFixed(
        1
      )} hours. ${peakTimeSummary}`
    : 'Loading productivity heatmap data.';

  const renderGrid = () => {
    if (isLoading) return <HotspotSkeleton />;
    if (isError) {
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          Could not load heatmap data.
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
        <div className='relative flex'>
          {/* FIX 1: Y-Axis Time Labels */}
          <div className='flex flex-col justify-between text-xs text-muted-foreground pt-6 pb-2 pr-2'>
            {TIME_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className='flex-1'>
            <div className='grid grid-cols-7 gap-1.5'>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className='text-center text-xs font-medium text-muted-foreground pb-2'
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 24 * 7 }).map((_, index) => {
                const dayIndex = index % 7;
                const hourIndex = Math.floor(index / 7);
                const value = data.heatmap[dayIndex][hourIndex];
                const hourLabel = format(new Date(2000, 0, 1, hourIndex), 'ha');
                const ariaLabel = `${
                  DAYS[dayIndex]
                } at ${hourLabel}: ${formatSecondsForTooltip(value)}.`;

                return (
                  <Tooltip key={`${dayIndex}-${hourIndex}`}>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        aria-label={ariaLabel}
                        className={`h-4 w-full rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getBackgroundColor(
                          value,
                          data.maxValue
                        )}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-sm font-semibold'>
                        {formatSecondsForTooltip(value)}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {DAYS[dayIndex]}s around {hourLabel}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <div className='sr-only' aria-live='polite'>
        {screenReaderSummary}
      </div>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Your Productivity Hotspot</CardTitle>

          <InsightTooltip
            content={
              <p>
                This heatmap shows your focus intensity throughout the week.
                More intense squares indicate more time spent in a focus session
                during that specific hour. Use this to identify your 'deep work'
                windows and schedule important tasks accordingly.
              </p>
            }
          />
        </div>
        <CardDescription>
          Focus intensity from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderGrid()}</CardContent>
      <CardFooter className='flex-col items-start gap-2 text-sm'>
        <div className='flex w-full items-center gap-2'>
          <span className='text-xs text-muted-foreground'>Less</span>
          <div className='flex flex-1 gap-1'>
            <div className='h-2 flex-1 rounded-full bg-muted/30'></div>
            <div className='h-2 flex-1 rounded-full bg-primary/20'></div>
            <div className='h-2 flex-1 rounded-full bg-primary/40'></div>
            <div className='h-2 flex-1 rounded-full bg-primary/60'></div>
            <div className='h-2 flex-1 rounded-full bg-primary/80'></div>
          </div>
          <span className='text-xs text-muted-foreground'>More</span>
        </div>
        {!isLoading && !isError && data && (
          <p className='w-full pt-2 text-xs text-muted-foreground'>
            {peakTimeSummary}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

function HotspotSkeleton() {
  return (
    <div className='flex'>
      <div className='flex flex-col justify-between pt-6 pb-2 pr-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-4 w-10' />
        ))}
      </div>
      <div className='flex-1'>
        <div className='grid grid-cols-7 gap-1.5'>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className='h-6 w-8 mx-auto' />
          ))}
          {Array.from({ length: 24 * 7 }).map((_, i) => (
            <Skeleton key={i} className='h-4 w-full' />
          ))}
        </div>
      </div>
    </div>
  );
}
