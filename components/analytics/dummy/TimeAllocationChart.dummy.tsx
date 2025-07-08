// components/analytics/dummy/TimeAllocationChart.dummy.tsx
'use client';

import { format } from 'date-fns';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart';

// --- Types and Helpers (Copied from the real component for consistency) ---
type TimeAllocationData = {
  chartData: {
    categoryName: string;
    totalSeconds: number;
  }[];
  uncategorizedSeconds: number;
};

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
const formatSecondsForTooltip = (seconds: number): string => {
  if (seconds === 0) return '0m';
  const hours = seconds / 3600;
  if (hours >= 1) return `${hours.toFixed(1)} hours`;
  const minutes = seconds / 60;
  if (minutes >= 1) return `${Math.round(minutes)} minutes`;
  return `${Math.round(seconds)} seconds`;
};
const formatSecondsForDisplay = (seconds: number): string => {
  if (seconds === 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : ''].filter(Boolean).join(' ');
};

// --- Dummy Data & Logic ---
// We start with more categories than we want to display to test the "Other" logic.
const dummyRawCategories = [
  { categoryName: 'Client Project A', totalSeconds: 10800 }, // 3h
  { categoryName: 'Internal "GridGoal" App', totalSeconds: 8100 }, // 2.25h
  { categoryName: 'Learning (Next.js 15)', totalSeconds: 6300 }, // 1.75h
  { categoryName: 'Team Meetings', totalSeconds: 4500 }, // 1.25h
  { categoryName: 'Bug Triage', totalSeconds: 2700 }, // 45m
  { categoryName: 'Admin & Emails', totalSeconds: 1800 }, // 30m
];

// This logic mimics what the improved API route does.
const MAX_CHART_SLICES = 4;
const topSlices = dummyRawCategories.slice(0, MAX_CHART_SLICES);
const otherSliceTotal = dummyRawCategories
  .slice(MAX_CHART_SLICES)
  .reduce((sum, item) => sum + item.totalSeconds, 0);
const processedChartData = [
  ...topSlices,
  { categoryName: 'Other', totalSeconds: otherSliceTotal },
];

const dummyDataWithOther: TimeAllocationData = {
  chartData: processedChartData,
  uncategorizedSeconds: 5400, // 1.5h
};

// --- Internal UI Component (Purely for Presentation) ---
interface TimeAllocationChartUIProps {
  data?: TimeAllocationData;
  isLoading?: boolean;
  isError?: boolean;
}

function TimeAllocationChartUI({
  data,
  isLoading,
  isError,
}: TimeAllocationChartUIProps) {
  const startDate = new Date('2023-10-01');
  const endDate = new Date('2023-10-31');

  const totalCategorizedTime = useMemo(
    () =>
      data?.chartData.reduce((sum, item) => sum + item.totalSeconds, 0) ?? 0,
    [data]
  );
  const totalFocusTime =
    totalCategorizedTime + (data?.uncategorizedSeconds || 0);

  const chartDataWithPercentage = useMemo(() => {
    if (!data?.chartData || totalCategorizedTime === 0) return [];
    return data.chartData.map((item) => ({
      ...item,
      percentage: ((item.totalSeconds / totalCategorizedTime) * 100).toFixed(0),
    }));
  }, [data, totalCategorizedTime]);

  const renderContent = () => {
    if (isLoading) return <ChartSkeleton />;
    if (isError) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <p className='font-semibold text-destructive'>
            Failed to load chart data.
          </p>
        </div>
      );
    }
    if (!data || data.chartData.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <PieChartIcon className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>No Categorized Data</p>
          <p className='text-sm text-muted-foreground'>
            Track time on categorized goals.
          </p>
        </div>
      );
    }

    return (
      <ChartContainer
        config={{}}
        className='mx-auto aspect-square max-h-[300px]'
      >
        <RechartsPieChart>
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const dataPoint = payload[0].payload;
                return (
                  <div className='rounded-lg border bg-background p-2.5 text-sm shadow-sm'>
                    <p className='font-bold'>{dataPoint.categoryName}</p>
                    <p className='text-muted-foreground'>
                      {formatSecondsForTooltip(dataPoint.totalSeconds)} (
                      {dataPoint.percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Pie
            data={chartDataWithPercentage}
            dataKey='totalSeconds'
            nameKey='categoryName'
            innerRadius={60}
            strokeWidth={5}
          >
            {chartDataWithPercentage.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                className={
                  entry.categoryName === 'Other'
                    ? 'stroke-muted-foreground/50'
                    : ''
                }
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ChartContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where Your Time Goes</CardTitle>
        <CardDescription>
          Focus time from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>{renderContent()}</CardContent>
      <CardFooter className='flex-col gap-2 text-sm pt-4'>
        <div className='flex items-center justify-between w-full font-medium'>
          <span>Total Focused Time</span>
          <span>{formatSecondsForDisplay(totalFocusTime)}</span>
        </div>
        {data && data.uncategorizedSeconds > 0 && (
          <div className='flex items-center justify-between w-full text-muted-foreground text-xs'>
            <span>Uncategorized Time</span>
            <span>{formatSecondsForDisplay(data.uncategorizedSeconds)}</span>
          </div>
        )}
        {!isLoading && !isError && data && data.chartData.length > 0 && (
          <ChartLegend
            content={<ChartLegendContent nameKey='categoryName' payload={{}} />}
            className='-mx-2 mt-2 w-full'
          />
        )}
      </CardFooter>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className='flex flex-col items-center justify-center p-8'>
      <div className='h-[250px] w-[250px] animate-pulse rounded-full bg-muted' />
    </div>
  );
}

// --- EXPORTED DUMMY COMPONENTS FOR TESTING ---

/** Displays the chart with a full set of data, including an "Other" category and uncategorized time. */
export const TimeAllocationChartWithData = () => (
  <TimeAllocationChartUI data={dummyDataWithOther} />
);

/** Displays the chart in its loading state. */
export const TimeAllocationChartLoading = () => (
  <TimeAllocationChartUI isLoading />
);

/** Displays the chart when there is no categorized data, but there IS uncategorized time. */
export const TimeAllocationChartEmptyWithUncategorized = () => (
  <TimeAllocationChartUI data={{ chartData: [], uncategorizedSeconds: 9800 }} />
);

/** Displays the chart when there is no data at all. */
export const TimeAllocationChartEmpty = () => (
  <TimeAllocationChartUI data={{ chartData: [], uncategorizedSeconds: 0 }} />
);

/** Displays the chart in an error state. */
export const TimeAllocationChartError = () => <TimeAllocationChartUI isError />;
