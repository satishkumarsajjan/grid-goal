'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { InsightTooltip } from './InsightTooltip';

type ViewMode = 'category' | 'goal';

type TimeAllocationData = {
  chartData: {
    name: string;
    totalSeconds: number;
    color?: string | null;
  }[];
  unallocatedSeconds: number;
};

const chartConfig: Record<
  ViewMode,
  {
    title: string;
    description: string;
    nameKey: string;
    emptyText: string;
    insight: string;
    unallocatedLabel: string;
  }
> = {
  category: {
    title: 'Time by Category',
    description: 'How your focus time is distributed across categories.',
    nameKey: 'name',
    emptyText: 'Track time on categorized goals to see your breakdown.',
    insight:
      'This chart shows how your focus time is distributed across your different work categories. Use it to check if your effort is aligned with your priorities.',
    unallocatedLabel: 'Uncategorized Time',
  },
  goal: {
    title: 'Time by Goal',
    description: 'How your focus time is distributed across individual goals.',
    nameKey: 'name',
    emptyText: 'Track time on goals to see your breakdown.',
    insight:
      'This chart shows which specific goals are receiving the most focus time. Use it to identify top priorities or goals that might be taking longer than expected.',
    unallocatedLabel: 'Unallocated Time',
  },
};

const FALLBACK_CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const OTHER_COLOR = 'var(--muted)';

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
  endDate: Date,
  by: ViewMode
): Promise<TimeAllocationData> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    by: by,
  });
  const { data } = await axios.get(
    `/api/analytics/time-allocation?${params.toString()}`
  );
  return data;
};

export function TimeAllocationChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const { data, isLoading, isError } = useQuery<TimeAllocationData>({
    queryKey: ['timeAllocation', { startDate, endDate, viewMode }],
    queryFn: () => fetchTimeAllocation(startDate, endDate, viewMode),
    placeholderData: (previousData) => previousData,
  });

  const totalAllocatedTime = useMemo(
    () =>
      data?.chartData.reduce((sum, item) => sum + item.totalSeconds, 0) ?? 0,
    [data]
  );

  const totalFocusTime = totalAllocatedTime + (data?.unallocatedSeconds || 0);
  const currentConfig = chartConfig[viewMode];

  const chartDataWithPercentage = useMemo(() => {
    if (!data?.chartData || totalAllocatedTime === 0) return [];
    return data.chartData.map((item) => ({
      ...item,
      percentage: ((item.totalSeconds / totalAllocatedTime) * 100).toFixed(0),
    }));
  }, [data, totalAllocatedTime]);

  const renderContent = () => {
    if (isLoading) return <ChartSkeleton />;
    if (isError)
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <p className='font-semibold text-destructive'>
            Failed to load chart data.
          </p>
        </div>
      );
    if (!data || data.chartData.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <PieChartIcon className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>No Data Available</p>
          <p className='text-sm text-muted-foreground'>
            {currentConfig.emptyText}
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
                    <p className='font-bold'>{dataPoint.name}</p>
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
            nameKey='name'
            innerRadius={60}
            strokeWidth={5}
          >
            {chartDataWithPercentage.map((entry, index) => {
              let fillColor =
                FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length];
              if (viewMode === 'goal') {
                if (entry.name === 'Other') {
                  fillColor = OTHER_COLOR;
                } else if (entry.color) {
                  fillColor = entry.color;
                }
              }

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={fillColor}
                  className='stroke-background'
                />
              );
            })}
          </Pie>
        </RechartsPieChart>
      </ChartContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{currentConfig.title}</CardTitle>
          <InsightTooltip content={<p>{currentConfig.insight}</p>} />
        </div>
        <CardDescription>
          {currentConfig.description} from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='category'>By Category</TabsTrigger>
            <TabsTrigger value='goal'>By Goal</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className='mt-4'>{renderContent()}</div>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm pt-4'>
        <div className='flex items-center justify-between w-full font-medium'>
          <span>Total Focused Time</span>
          <span>{formatSecondsForDisplay(totalFocusTime)}</span>
        </div>
        {viewMode === 'category' && data && data.unallocatedSeconds > 0 && (
          <div className='flex items-center justify-between w-full text-muted-foreground text-xs'>
            <span>{currentConfig.unallocatedLabel}</span>
            <span>{formatSecondsForDisplay(data.unallocatedSeconds)}</span>
          </div>
        )}
        {!isLoading && !isError && data && data.chartData.length > 0 && (
          <ChartLegend
            content={<ChartLegendContent nameKey='name' payload={{}} />}
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
