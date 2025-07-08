'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { SessionVibe } from '@prisma/client';

import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

// --- Type Definitions ---
// The raw data shape returned by the API
type FlowTriggerRawData = {
  categoryName: string;
  vibe: SessionVibe;
  count: number;
};

// The transformed data shape required by the Recharts BarChart
type ChartData = {
  categoryName: string;
  FLOW: number;
  NEUTRAL: number;
  STRUGGLE: number;
};

// --- Chart Configuration ---
// Defines labels and colors for the chart legend and bars.
// Ensure these CSS variables are defined in your global styles.
const chartConfig = {
  FLOW: { label: 'Flow', color: 'hsl(var(--chart-green))' },
  NEUTRAL: { label: 'Neutral', color: 'hsl(var(--chart-yellow))' },
  STRUGGLE: { label: 'Struggle', color: 'hsl(var(--chart-red))' },
};

// --- API Fetcher ---
const fetchFlowTriggers = async (
  startDate: Date,
  endDate: Date
): Promise<FlowTriggerRawData[]> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const { data } = await axios.get(
    `/api/analytics/flow-triggers?${params.toString()}`
  );
  return data;
};

// --- Main Component ---
export function FlowTriggersChart() {
  // Read the date range directly from the global Zustand store.
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const {
    data: rawData,
    isLoading,
    isError,
    error,
  } = useQuery<FlowTriggerRawData[]>({
    // The queryKey now includes the global startDate and endDate.
    // TanStack Query will automatically refetch when these values change.
    queryKey: ['flowTriggers', { startDate, endDate }],
    queryFn: () => fetchFlowTriggers(startDate, endDate),
    // Keep previous data visible while new data is loading for a smoother UX.
    placeholderData: (previousData) => previousData,
  });

  // useMemo is crucial here to transform the raw data into a format suitable
  // for a stacked bar chart, and to prevent re-computation on every render.
  const chartData: ChartData[] = useMemo(() => {
    if (!rawData) return [];

    const groupedData = rawData.reduce<Record<string, ChartData>>(
      (acc, item) => {
        if (!acc[item.categoryName]) {
          acc[item.categoryName] = {
            categoryName: item.categoryName,
            FLOW: 0,
            NEUTRAL: 0,
            STRUGGLE: 0,
          };
        }
        acc[item.categoryName][item.vibe] = item.count;
        return acc;
      },
      {}
    );

    return Object.values(groupedData);
  }, [rawData]);

  const renderContent = () => {
    if (isLoading) return <ChartSkeleton />;
    if (isError) {
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          {axios.isAxiosError(error)
            ? error.response?.data?.error || error.message
            : 'Could not load chart data.'}
        </p>
      );
    }
    if (chartData.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <Zap className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Find Your Flow</p>
          <p className='text-sm text-muted-foreground'>
            Set a 'Vibe' after a focus session in this period to see what drives
            your flow.
          </p>
        </div>
      );
    }

    return (
      <ChartContainer config={chartConfig} className='min-h-[250px] w-full'>
        <BarChart accessibilityLayer data={chartData} layout='vertical'>
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey='categoryName'
            type='category'
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className='text-xs'
            width={80} // Give space for long category names
          />
          <XAxis dataKey='total' type='number' hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <ChartLegend
            content={<ChartLegendContent nameKey='categoryName' payload={{}} />}
          />
          <Bar
            dataKey='STRUGGLE'
            stackId='a'
            fill={chartConfig.STRUGGLE.color}
            radius={[4, 0, 0, 4]}
          />
          <Bar dataKey='NEUTRAL' stackId='a' fill={chartConfig.NEUTRAL.color} />
          <Bar
            dataKey='FLOW'
            stackId='a'
            fill={chartConfig.FLOW.color}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ChartContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Your Flow Triggers</CardTitle>
        <CardDescription>
          Which types of work put you in a state of flow from{' '}
          {format(startDate, 'MMM d')} to {format(endDate, 'MMM d')}?
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

// --- Skeleton Component ---
function ChartSkeleton() {
  return (
    <div className='space-y-4 p-4'>
      <div className='flex justify-center gap-4'>
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-4 w-16' />
      </div>
      <Skeleton className='h-8 w-full' />
      <Skeleton className='h-8 w-full' />
      <Skeleton className='h-8 w-full' />
    </div>
  );
}
