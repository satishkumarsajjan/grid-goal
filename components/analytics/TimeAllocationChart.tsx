'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
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
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { InsightTooltip } from './InsightTooltip';

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

const fetchTimeAllocation = async (
  startDate: Date,
  endDate: Date
): Promise<TimeAllocationData> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const { data } = await axios.get(
    `/api/analytics/time-by-category?${params.toString()}`
  );
  return data;
};

export function TimeAllocationChart() {
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const { data, isLoading, isError, error } = useQuery<TimeAllocationData>({
    queryKey: ['timeAllocation', { startDate, endDate }],
    queryFn: () => fetchTimeAllocation(startDate, endDate),
    placeholderData: (previousData) => previousData,
  });

  const totalCategorizedTime = useMemo(
    () =>
      data?.chartData.reduce((sum, item) => sum + item.totalSeconds, 0) ?? 0,
    [data]
  );

  const totalFocusTime =
    totalCategorizedTime + (data?.uncategorizedSeconds || 0);

  // Prepare data and config for the chart, adding percentages
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
            Track time on categorized goals to see your breakdown.
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
        <div className='flex items-center justify-between'>
          <CardTitle>Where your time goes</CardTitle>

          <InsightTooltip
            content={
              <p>
                This chart shows how your focus time is distributed across your
                different work categories. Use it to check if your effort is
                aligned with your priorities.
              </p>
            }
          />
        </div>
        <CardDescription>
          Focus time by category from {format(startDate, 'MMM d')} to{' '}
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
