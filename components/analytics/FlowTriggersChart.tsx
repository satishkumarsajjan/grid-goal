'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // NEW
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { InsightTooltip } from './InsightTooltip';

// --- Type Definitions ---
type ViewMode = 'category' | 'goal';

type VibeAnalysisData = {
  name: string; // categoryName or goalTitle
  FLOW: number;
  NEUTRAL: number;
  STRUGGLE: number;
  totalSessions: number;
};

// --- Configs ---
const chartConfig = {
  FLOW: { label: 'Flow', color: 'var(--chart-3)' },
  NEUTRAL: { label: 'Neutral', color: 'var(--chart-4)' },
  STRUGGLE: { label: 'Struggle', color: 'var(--chart-5)' },
};

const viewConfig: Record<
  ViewMode,
  {
    title: string;
    description: string;
    nameKey: string;
    emptyText: string;
    insight: string;
  }
> = {
  category: {
    title: 'Flow by Category',
    description: "Percentage of session 'vibes' for your top categories.",
    nameKey: 'name',
    emptyText:
      "Set a 'Vibe' after sessions on categorized goals to see your breakdown.",
    insight:
      "This chart analyzes the 'vibe' you set after focus sessions. It helps you understand which types of work are most likely to put you in a state of flow, and which ones consistently lead to struggle.",
  },
  goal: {
    title: 'Flow by Goal',
    description: "Percentage of session 'vibes' for your top goals.",
    nameKey: 'name',
    emptyText:
      "Set a 'Vibe' after focus sessions to see which goals drive your flow.",
    insight:
      "This chart analyzes the 'vibe' for individual goals. Use it to pinpoint exactly which projects energize you and which ones may need a different approach or breaking down further.",
  },
};

const fetchVibeAnalysis = async (
  startDate: Date,
  endDate: Date,
  by: ViewMode
): Promise<VibeAnalysisData[]> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    by: by,
  });
  // Use the new API endpoint
  const { data } = await axios.get(
    `/api/analytics/vibe-analysis?${params.toString()}`
  );
  return data;
};

export function FlowTriggersChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const { data, isLoading, isError } = useQuery<VibeAnalysisData[]>({
    queryKey: ['vibeAnalysis', { startDate, endDate, viewMode }],
    queryFn: () => fetchVibeAnalysis(startDate, endDate, viewMode),
    placeholderData: (previousData) => previousData,
  });

  const currentConfig = viewConfig[viewMode];

  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;
    if (data.length < 2)
      return 'Track more sessions to get a comparative analysis.';

    const withPercentages = data.map((d) => ({
      ...d,
      flowPct: d.totalSessions > 0 ? d.FLOW / d.totalSessions : 0,
    }));

    const bestFlow = withPercentages.reduce((max, cur) =>
      cur.flowPct > max.flowPct ? cur : max
    );

    if (bestFlow.flowPct < 0.5) {
      return `You maintain a neutral balance across most of your work.`;
    }

    return `${bestFlow.name} seems to be your greatest source of flow.`;
  }, [data]);

  const screenReaderSummary = data
    ? `Chart of session vibes by ${viewMode}. ${summary?.replace(/\*\*/g, '')}`
    : `Loading session vibe data by ${viewMode}.`;

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
            {currentConfig.emptyText}
          </p>
        </div>
      );
    }

    return (
      <ChartContainer config={chartConfig} className='min-h-[250px] w-full'>
        <BarChart
          accessibilityLayer
          data={data}
          layout='vertical'
          stackOffset='expand'
        >
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey='name'
            type='category'
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className='text-xs truncate'
            width={80}
          />
          <XAxis type='number' hide />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const dataPoint = payload[0].payload as VibeAnalysisData;
                return (
                  <div className='rounded-lg border bg-background p-2.5 text-sm shadow-sm'>
                    <p className='font-bold'>{dataPoint.name}</p>
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
          <ChartLegend content={<ChartLegendContent payload={{}} />} />
          <Bar
            dataKey='FLOW'
            stackId='a'
            fill={chartConfig.FLOW.color}
            radius={[4, 0, 0, 4]}
          />
          <Bar dataKey='NEUTRAL' stackId='a' fill={chartConfig.NEUTRAL.color} />
          <Bar
            dataKey='STRUGGLE'
            stackId='a'
            fill={chartConfig.STRUGGLE.color}
            radius={[0, 4, 4, 0]}
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
        <div className='flex items-center justify-between'>
          <CardTitle>{currentConfig.title}</CardTitle>
          <InsightTooltip content={<p>{currentConfig.insight}</p>} />
        </div>
        <CardDescription>
          {currentConfig.description} from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
