// components/analytics/dummy/ProductivityHotspotChart.dummy.tsx
'use client';

import { format } from 'date-fns';
import { BrainCircuit } from 'lucide-react';
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

// --- Types and Helpers ---
type ProductivityHotspotData = { heatmap: number[][]; maxValue: number };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formatSeconds = (s: number) =>
  s < 1 ? 'No focus' : new Date(s * 1000).toISOString().slice(11, 19);
const getBackgroundColor = (value: number, maxValue: number) => {
  if (value === 0 || maxValue === 0) return 'bg-muted/50';
  const intensity = Math.min(value / maxValue, 1);
  if (intensity < 0.01) return 'bg-muted/50';
  if (intensity < 0.25) return 'bg-primary/20';
  if (intensity < 0.5) return 'bg-primary/40';
  if (intensity < 0.75) return 'bg-primary/60';
  return 'bg-primary/80';
};

// --- Dummy Data ---
const dummyHeatmap = Array(7)
  .fill(0)
  .map(() => Array(24).fill(0));
// Morning focus on weekdays
for (let day = 1; day <= 5; day++) {
  for (let hour = 9; hour <= 11; hour++) {
    dummyHeatmap[day][hour] = Math.random() * 3600;
  }
}
// Afternoon slump
for (let day = 1; day <= 5; day++) {
  for (let hour = 14; hour <= 16; hour++) {
    dummyHeatmap[day][hour] = Math.random() * 1200;
  }
}
// Weekend focus
dummyHeatmap[6][10] = 2500;
dummyHeatmap[0][11] = 1800;
const dummyMaxValue = Math.max(...dummyHeatmap.flat());
const dummyData: ProductivityHotspotData = {
  heatmap: dummyHeatmap,
  maxValue: dummyMaxValue,
};
const dummyStartDate = new Date('2023-08-01');
const dummyEndDate = new Date('2023-10-31');

// --- Internal UI Component ---
interface ProductivityHotspotChartUIProps {
  data?: ProductivityHotspotData;
  isLoading?: boolean;
  isError?: boolean;
  startDate: Date;
  endDate: Date;
}

function ProductivityHotspotChartUI({
  data,
  isLoading,
  isError,
  startDate,
  endDate,
}: ProductivityHotspotChartUIProps) {
  const renderGrid = () => {
    if (isLoading) return <HotspotSkeleton />;
    if (isError)
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          Could not load heatmap data.
        </p>
      );
    if (!data || data.maxValue === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <BrainCircuit className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Not Enough Data</p>
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
          Focus intensity from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderGrid()}</CardContent>
    </Card>
  );
}

function HotspotSkeleton() {
  return (
    <div className='grid grid-cols-7 gap-1.5 p-1'>
      {Array.from({ length: 7 * 25 }).map((_, i) => (
        <Skeleton key={i} className='h-4 w-full' />
      ))}
    </div>
  );
}

// --- Exported Dummy Components ---
export const ProductivityHotspotChartWithData = () => (
  <ProductivityHotspotChartUI
    data={dummyData}
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const ProductivityHotspotChartLoading = () => (
  <ProductivityHotspotChartUI
    isLoading
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const ProductivityHotspotChartEmpty = () => (
  <ProductivityHotspotChartUI
    data={{ heatmap: [], maxValue: 0 }}
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const ProductivityHotspotChartError = () => (
  <ProductivityHotspotChartUI
    isError
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
