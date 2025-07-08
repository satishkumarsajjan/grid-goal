'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
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
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

// --- Type Definitions ---
type FlowTriggerData = {
  categoryName: string;
  FLOW: number;
  NEUTRAL: number;
  STRUGGLE: number;
  totalSessions: number;
};

// --- Chart Configuration ---
const chartConfig = {
  FLOW: { label: 'Flow', color: 'var(--chart-3)' },
  NEUTRAL: { label: 'Neutral', color: 'var(--chart-4)' },
  STRUGGLE: { label: 'Struggle', color: 'var(--chart-5)' },
};

// --- API Fetcher ---
const fetchFlowTriggers = async (
  startDate: Date,
  endDate: Date
): Promise<FlowTriggerData[]> => {
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
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const { data, isLoading, isError } = useQuery<FlowTriggerData[]>({
    queryKey: ['flowTriggers', { startDate, endDate }],
    queryFn: () => fetchFlowTriggers(startDate, endDate),
    placeholderData: (previousData) => previousData,
  });

  // --- Summarized Insight Logic ---
  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;

    const withPercentages = data.map((d) => ({
      ...d,
      flowPct: d.totalSessions > 0 ? d.FLOW / d.totalSessions : 0,
      strugglePct: d.totalSessions > 0 ? d.STRUGGLE / d.totalSessions : 0,
    }));

    const bestFlow = withPercentages.reduce((max, cur) =>
      cur.flowPct > max.flowPct ? cur : max
    );
    const worstStruggle = withPercentages.reduce((max, cur) =>
      cur.strugglePct > max.strugglePct ? cur : max
    );

    if (bestFlow.flowPct < 0.5 && worstStruggle.strugglePct < 0.5) {
      return 'You maintain a neutral balance across most of your work categories.';
    }

    return `**${bestFlow.categoryName}** seems to be your greatest source of flow, while **${worstStruggle.categoryName}** presents the most struggle.`;
  }, [data]);

  const screenReaderSummary = data
    ? `Chart of session vibes by category. ${summary?.replace(/\*\*/g, '')}`
    : 'Loading session vibe data.';

  const renderContent = () => {
    if (isLoading) return <ChartSkeleton />;
    if (isError)
      return (
        <p className='p-4 text-center text-sm text-destructive'>
          Could not load chart data.
        </p>
      );
    if (!data || data.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <Zap className='h-10 w-10 text-muted-foreground mb-4' />
          <p className='font-semibold'>Find Your Flow</p>
          <p className='text-sm text-muted-foreground'>
            Set a 'Vibe' after a focus session to see what drives your flow.
          </p>
        </div>
      );
    }

    return (
      <ChartContainer config={chartConfig} className='min-h-[250px] w-full'>
        {/* IMPROVEMENT: Changed to a 100% stacked bar chart */}
        <BarChart
          accessibilityLayer
          data={data}
          layout='vertical'
          stackOffset='expand'
        >
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey='categoryName'
            type='category'
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className='text-xs'
            width={80} // Provides space for long category names
          />
          <XAxis type='number' hide />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const dataPoint = payload[0].payload as FlowTriggerData;
                return (
                  <div className='rounded-lg border bg-background p-2.5 text-sm shadow-sm'>
                    <p className='font-bold'>{dataPoint.categoryName}</p>
                    <ul className='mt-1 space-y-1 text-muted-foreground'>
                      <li className='flex items-center gap-2'>
                        <span
                          className='h-2.5 w-2.5 rounded-full'
                          style={{ backgroundColor: chartConfig.FLOW.color }}
                        />
                        Flow: {dataPoint.FLOW} sessions
                      </li>
                      <li className='flex items-center gap-2'>
                        <span
                          className='h-2.5 w-2.5 rounded-full'
                          style={{ backgroundColor: chartConfig.NEUTRAL.color }}
                        />
                        Neutral: {dataPoint.NEUTRAL} sessions
                      </li>
                      <li className='flex items-center gap-2'>
                        <span
                          className='h-2.5 w-2.5 rounded-full'
                          style={{
                            backgroundColor: chartConfig.STRUGGLE.color,
                          }}
                        />
                        Struggle: {dataPoint.STRUGGLE} sessions
                      </li>
                    </ul>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* IMPROVEMENT: Corrected legend implementation */}
          <ChartLegend
            content={<ChartLegendContent nameKey='' payload={{}} />}
          />
          <Bar
            dataKey='FLOW'
            stackId='a'
            fill={chartConfig.FLOW.color}
            radius={[0, 4, 4, 0]}
          />
          <Bar dataKey='NEUTRAL' stackId='a' fill={chartConfig.NEUTRAL.color} />
          <Bar
            dataKey='STRUGGLE'
            stackId='a'
            fill={chartConfig.STRUGGLE.color}
            radius={[4, 0, 0, 4]}
          />
        </BarChart>
      </ChartContainer>
    );
  };

  return (
    <Card>
      <div className='sr-only' aria-live='polite'>
        {screenReaderSummary}
      </div>
      <CardHeader>
        <CardTitle>Find Your Flow Triggers</CardTitle>
        <CardDescription>
          Percentage of session 'vibes' for your top categories from{' '}
          {format(startDate, 'MMM d')} to {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
      {summary && (
        <CardFooter>
          <p
            className='text-xs text-muted-foreground'
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        </CardFooter>
      )}
    </Card>
  );
}

// --- Skeleton Component (Unchanged) ---
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
