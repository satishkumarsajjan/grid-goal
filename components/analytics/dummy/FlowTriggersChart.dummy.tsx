// components/analytics/dummy/FlowTriggersChart.dummy.tsx
'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
import { SessionVibe } from '@prisma/client';

// --- Types and Helpers ---
type FlowTriggerRawData = {
  categoryName: string;
  vibe: SessionVibe;
  count: number;
};
type ChartData = {
  categoryName: string;
  FLOW: number;
  NEUTRAL: number;
  STRUGGLE: number;
};
const chartConfig = {
  FLOW: { label: 'Flow', color: 'var(--chart-1)' },
  NEUTRAL: { label: 'Neutral', color: 'var(--chart-2)' },
  STRUGGLE: { label: 'Struggle', color: 'var(--chart-3)' },
};

// --- Dummy Data ---
const dummyRawData: FlowTriggerRawData[] = [
  { categoryName: 'Creative Design', vibe: 'FLOW', count: 15 },
  { categoryName: 'Creative Design', vibe: 'NEUTRAL', count: 5 },
  { categoryName: 'Creative Design', vibe: 'STRUGGLE', count: 2 },
  { categoryName: 'Bug Fixing', vibe: 'FLOW', count: 1 },
  { categoryName: 'Bug Fixing', vibe: 'NEUTRAL', count: 8 },
  { categoryName: 'Bug Fixing', vibe: 'STRUGGLE', count: 12 },
  { categoryName: 'Documentation', vibe: 'FLOW', count: 4 },
  { categoryName: 'Documentation', vibe: 'NEUTRAL', count: 10 },
  { categoryName: 'Documentation', vibe: 'STRUGGLE', count: 1 },
];
const dummyStartDate = new Date('2023-10-01');
const dummyEndDate = new Date('2023-10-31');

// --- Internal UI Component ---
interface FlowTriggersChartUIProps {
  rawData?: FlowTriggerRawData[];
  isLoading?: boolean;
  isError?: boolean;
  startDate: Date;
  endDate: Date;
}

function FlowTriggersChartUI({
  rawData,
  isLoading,
  isError,
  startDate,
  endDate,
}: FlowTriggersChartUIProps) {
  const chartData: ChartData[] = useMemo(() => {
    if (!rawData) return [];
    const groupedData = rawData.reduce<Record<string, ChartData>>(
      (acc, item) => {
        if (!acc[item.categoryName])
          acc[item.categoryName] = {
            categoryName: item.categoryName,
            FLOW: 0,
            NEUTRAL: 0,
            STRUGGLE: 0,
          };
        acc[item.categoryName][item.vibe] = item.count;
        return acc;
      },
      {}
    );
    return Object.values(groupedData);
  }, [rawData]);

  const renderContent = () => {
    if (isLoading) return <ChartSkeleton />;
    if (isError)
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          Could not load chart data.
        </p>
      );
    if (chartData.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <Zap className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Find Your Flow</p>
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
            width={80}
          />
          <XAxis dataKey='total' type='number' hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <ChartLegend content={<ChartLegendContent />} />
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
          Vibes from {format(startDate, 'MMM d')} to {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className='space-y-4 p-4'>
      <Skeleton className='h-8 w-full' />
      <Skeleton className='h-8 w-full' />
      <Skeleton className='h-8 w-full' />
    </div>
  );
}

// --- Exported Dummy Components ---
export const FlowTriggersChartWithData = () => (
  <FlowTriggersChartUI
    rawData={dummyRawData}
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const FlowTriggersChartLoading = () => (
  <FlowTriggersChartUI
    isLoading
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const FlowTriggersChartEmpty = () => (
  <FlowTriggersChartUI
    rawData={[]}
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const FlowTriggersChartError = () => (
  <FlowTriggersChartUI
    isError
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
