'use client';

import { addDays, format, startOfWeek } from 'date-fns';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// --- MOCK DATA & HELPERS FOR LANDING PAGE ---

// Mock a simplified version of the analytics store
const useAnalyticsStore = () => ({
  range: {
    startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
    endDate: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 27), // Approx 4 weeks
  },
});

// A generic InsightTooltip component to replace the imported one
const InsightTooltip = ({ content }: { content: React.ReactNode }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button className='cursor-help text-muted-foreground hover:text-foreground'>
          <Info className='h-4 w-4' />
        </button>
      </TooltipTrigger>
      <TooltipContent className='max-w-xs' side='top' align='end'>
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// --- 1. TIME ALLOCATION CHART DUMMY DATA ---
type TimeAllocationViewMode = 'category' | 'goal';
const formatSecondsForDisplay = (seconds: number): string => {
  if (seconds === 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : ''].filter(Boolean).join(' ');
};

const DUMMY_TIME_ALLOCATION = {
  goal: {
    chartData: [
      {
        name: 'Launch Q3 Feature',
        totalSeconds: 162000,
        color: 'var(--chart-1)',
      },
      {
        name: 'Refactor Auth System',
        totalSeconds: 126000,
        color: 'var(--chart-2)',
      },
      {
        name: 'User Interview Synthesis',
        totalSeconds: 72000,
        color: 'var(--chart-3)',
      },
      {
        name: 'Plan Q4 Roadmap',
        totalSeconds: 54000,
        color: 'var(--chart-4)',
      },
      { name: 'Other', totalSeconds: 36000, color: 'var(--muted)' },
    ],
    unallocatedSeconds: 0,
  },
  category: {
    chartData: [
      {
        name: 'Core Development',
        totalSeconds: 288000,
        color: 'var(--chart-1)',
      },
      {
        name: 'Product & Strategy',
        totalSeconds: 126000,
        color: 'var(--chart-3)',
      },
      {
        name: 'Admin & Meetings',
        totalSeconds: 18000,
        color: 'var(--chart-5)',
      },
    ],
    unallocatedSeconds: 18000,
  },
};

// --- 2. FLOW TRIGGERS CHART DUMMY DATA ---
type FlowViewMode = 'category' | 'goal';
const DUMMY_FLOW_TRIGGERS = {
  goal: [
    {
      name: 'Launch Q3 Feature',
      FLOW: 25,
      NEUTRAL: 5,
      STRUGGLE: 1,
      totalSessions: 31,
    },
    {
      name: 'Refactor Auth System',
      FLOW: 18,
      NEUTRAL: 8,
      STRUGGLE: 3,
      totalSessions: 29,
    },
    {
      name: 'User Interview Synthesis',
      FLOW: 15,
      NEUTRAL: 4,
      STRUGGLE: 0,
      totalSessions: 19,
    },
    {
      name: 'Plan Q4 Roadmap',
      FLOW: 12,
      NEUTRAL: 2,
      STRUGGLE: 1,
      totalSessions: 15,
    },
  ],
  category: [
    {
      name: 'Core Development',
      FLOW: 43,
      NEUTRAL: 13,
      STRUGGLE: 4,
      totalSessions: 60,
    },
    {
      name: 'Product & Strategy',
      FLOW: 27,
      NEUTRAL: 6,
      STRUGGLE: 1,
      totalSessions: 34,
    },
    {
      name: 'Admin & Meetings',
      FLOW: 5,
      NEUTRAL: 10,
      STRUGGLE: 2,
      totalSessions: 17,
    },
  ],
};

// --- 3. SUSTAINABILITY REPORT DUMMY DATA ---
const DUMMY_WEEKLY_BALANCE = [
  { dayOfWeek: 0, totalSeconds: 3600 * 1 }, // Sun
  { dayOfWeek: 1, totalSeconds: 3600 * 9.5 }, // Mon
  { dayOfWeek: 2, totalSeconds: 3600 * 9 }, // Tue
  { dayOfWeek: 3, totalSeconds: 3600 * 10 }, // Wed
  { dayOfWeek: 4, totalSeconds: 3600 * 9.5 }, // Thu
  { dayOfWeek: 5, totalSeconds: 3600 * 7 }, // Fri
  { dayOfWeek: 6, totalSeconds: 3600 * 4 }, // Sat
];
const DUMMY_POMODORO_STATS = { WORK: 85, SHORT_BREAK: 60, LONG_BREAK: 20 };

// --- 4. PRODUCTIVITY HOTSPOT CHART DUMMY DATA ---
// ***** CORRECTED DATA GENERATION LOGIC *****
const createHotspotData = () => {
  const heatmap = Array(7)
    .fill(0)
    .map(() => Array(24).fill(0));
  let maxValue = 0;

  // Function to set value and update maxValue, ensuring it's never > 3600
  const setHeatmapValue = (day: number, hour: number, seconds: number) => {
    const realisticSeconds = Math.min(seconds, 3600); // Cap at 1 hour
    heatmap[day][hour] = realisticSeconds;
    if (realisticSeconds > maxValue) {
      maxValue = realisticSeconds;
    }
  };

  // Weekdays (Mon-Fri, indices 1-5)
  for (let day = 1; day <= 5; day++) {
    // Morning Deep Work (9am-12pm) - very high focus (50-58 mins)
    for (let hour = 9; hour < 12; hour++) {
      const value = 3000 + Math.random() * 480; // 50-58 mins
      setHeatmapValue(day, hour, value);
    }
    // Lunch break (12pm) - very low focus (0-5 mins)
    setHeatmapValue(day, 12, Math.random() * 300);

    // Afternoon Focus (1pm-5pm) - high focus (45-55 mins)
    for (let hour = 13; hour < 17; hour++) {
      const value = 2700 + Math.random() * 600; // 45-55 mins
      setHeatmapValue(day, hour, value);
    }
    // Evening catch up (7pm-9pm) - medium focus (20-40 mins)
    for (let hour = 19; hour < 21; hour++) {
      setHeatmapValue(day, hour, 1200 + Math.random() * 1200);
    }
  }

  // Saturday (index 6) - half day, moderate focus (30-50 mins)
  for (let hour = 9; hour < 13; hour++) {
    setHeatmapValue(6, hour, 1800 + Math.random() * 1200);
  }

  // Sunday (index 0) - light planning (20-30 mins)
  setHeatmapValue(0, 10, 1200 + Math.random() * 600);

  const totalSeconds = heatmap.flat().reduce((a, b) => a + b, 0);

  return {
    heatmap,
    maxValue,
    peakTime: { day: 3, hour: 10 }, // Wednesday 10 AM
    totalHours: totalSeconds / 3600,
  };
};
const DUMMY_HOTSPOT_DATA = createHotspotData();

// --- 5. ESTIMATION ACCURACY REPORT DUMMY DATA ---
const DUMMY_ESTIMATION_ACCURACY = {
  page1: {
    totalCount: 12,
    data: [
      {
        goalId: 'g1',
        goalTitle: 'Deploy Staging Server',
        completedAt: '2023-10-26T10:00:00.000Z',
        totalEstimatedSeconds: 7200,
        totalActualSeconds: 6300,
      },
      {
        goalId: 'g2',
        goalTitle: 'Finalize UI Mockups for Dashboard V2',
        completedAt: '2023-10-25T15:30:00.000Z',
        totalEstimatedSeconds: 14400,
        totalActualSeconds: 13800,
      },
      {
        goalId: 'g3',
        goalTitle: 'Write API documentation for new endpoints',
        completedAt: '2023-10-24T18:00:00.000Z',
        totalEstimatedSeconds: 10800,
        totalActualSeconds: 9000,
      },
      {
        goalId: 'g4',
        goalTitle: 'Fix critical bug in payment processing',
        completedAt: '2023-10-23T11:00:00.000Z',
        totalEstimatedSeconds: 3600,
        totalActualSeconds: 4200, // An underestimate
      },
      {
        goalId: 'g5',
        goalTitle: 'Prepare slides for weekly sprint review',
        completedAt: '2023-10-22T14:00:00.000Z',
        totalEstimatedSeconds: 5400,
        totalActualSeconds: 5000,
      },
    ],
  },
  page2: {
    totalCount: 12,
    data: [
      {
        goalId: 'g6',
        goalTitle: 'Client feedback implementation round 1',
        completedAt: '2023-10-21T17:00:00.000Z',
        totalEstimatedSeconds: 18000,
        totalActualSeconds: 17100,
      },
      {
        goalId: 'g7',
        goalTitle: 'Set up new project CI/CD pipeline',
        completedAt: '2023-10-20T12:00:00.000Z',
        totalEstimatedSeconds: 28800,
        totalActualSeconds: 29400, // Another underestimate
      },
      {
        goalId: 'g8',
        goalTitle: 'Onboard new team member',
        completedAt: '2023-10-19T16:00:00.000Z',
        totalEstimatedSeconds: 0, // Not estimated
        totalActualSeconds: 9000,
      },
    ],
  },
};

// --- TYPE DEFINITIONS ---
type VibeAnalysisData = {
  name: string;
  FLOW: number;
  NEUTRAL: number;
  STRUGGLE: number;
  totalSessions: number;
};
type PomodoroStatsData = {
  WORK: number;
  SHORT_BREAK: number;
  LONG_BREAK: number;
};
type WeeklyBalanceData = { dayOfWeek: number; totalSeconds: number };
type PeakTime = { day: number; hour: number } | null;
type ProductivityHotspotData = {
  heatmap: number[][];
  maxValue: number;
  peakTime: PeakTime;
  totalHours: number;
};
type TimeAllocationData = {
  chartData: {
    name: string;
    totalSeconds: number;
    color?: string | null;
  }[];
  unallocatedSeconds: number;
};
type EstimationAccuracyItem = {
  goalId: string;
  goalTitle: string;
  completedAt: string;
  totalEstimatedSeconds: number;
  totalActualSeconds: number;
};
type ProcessedAccuracyItem = EstimationAccuracyItem & {
  variancePercent: number | null;
  isOver: boolean;
  wasEstimated: boolean;
};

// --- INDIVIDUAL ANALYTICS COMPONENTS ---

// 1. Time Allocation Chart
function TimeAllocationChart() {
  const [viewMode, setViewMode] = useState<TimeAllocationViewMode>('goal');
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const data = DUMMY_TIME_ALLOCATION[viewMode];
  const isLoading = false;
  const isError = false;

  const totalAllocatedTime = useMemo(
    () => data.chartData.reduce((sum, item) => sum + item.totalSeconds, 0),
    [data]
  );
  const totalFocusTime = totalAllocatedTime + data.unallocatedSeconds;

  const chartConfig = {
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
      description:
        'How your focus time is distributed across individual goals.',
      nameKey: 'name',
      emptyText: 'Track time on goals to see your breakdown.',
      insight:
        'This chart shows which specific goals are receiving the most focus time. Use it to identify top priorities or goals that might be taking longer than expected.',
      unallocatedLabel: 'Unallocated Time',
    },
  };
  const currentConfig = chartConfig[viewMode];

  const chartDataWithPercentage = useMemo(() => {
    if (!data.chartData || totalAllocatedTime === 0) return [];
    return data.chartData.map((item) => ({
      ...item,
      percentage: ((item.totalSeconds / totalAllocatedTime) * 100).toFixed(0),
    }));
  }, [data, totalAllocatedTime]);

  const formatSecondsForTooltip = (seconds: number): string => {
    if (seconds === 0) return '0m';
    const hours = seconds / 3600;
    if (hours >= 1) return `${hours.toFixed(1)} hours`;
    const minutes = seconds / 60;
    if (minutes >= 1) return `${Math.round(minutes)} minutes`;
    return `${Math.round(seconds)} seconds`;
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
          onValueChange={(value) =>
            setViewMode(value as TimeAllocationViewMode)
          }
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='goal'>By Goal</TabsTrigger>
            <TabsTrigger value='category'>By Category</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className='mt-4'>
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
                {chartDataWithPercentage.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.color || 'var(--chart-1)'}
                    className='stroke-background'
                  />
                ))}
              </Pie>
            </RechartsPieChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm pt-4'>
        <div className='flex items-center justify-between w-full font-medium'>
          <span>Total Focused Time</span>
          <span>{formatSecondsForDisplay(totalFocusTime)}</span>
        </div>
        {viewMode === 'category' && data.unallocatedSeconds > 0 && (
          <div className='flex items-center justify-between w-full text-muted-foreground text-xs'>
            <span>{currentConfig.unallocatedLabel}</span>
            <span>{formatSecondsForDisplay(data.unallocatedSeconds)}</span>
          </div>
        )}
        <ChartLegend
          content={<ChartLegendContent nameKey='name' payload={{}} />}
          className='-mx-2 mt-2 w-full'
        />
      </CardFooter>
    </Card>
  );
}

// 2. Flow Triggers Chart
function FlowTriggersChart() {
  const [viewMode, setViewMode] = useState<FlowViewMode>('goal');
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const data = DUMMY_FLOW_TRIGGERS[viewMode];
  const isLoading = false;
  const isError = false;

  const chartConfig = {
    FLOW: { label: 'Flow', color: 'var(--chart-3)' },
    NEUTRAL: { label: 'Neutral', color: 'var(--chart-4)' },
    STRUGGLE: { label: 'Struggle', color: 'var(--chart-5)' },
  };

  const viewConfig: Record<FlowViewMode, any> = {
    category: {
      title: 'Flow by Category',
      description: "Percentage of session 'vibes' for your top categories.",
      insight:
        "This chart analyzes the 'vibe' you set after focus sessions. It helps you understand which types of work are most likely to put you in a state of flow, and which ones consistently lead to struggle.",
    },
    goal: {
      title: 'Flow by Goal',
      description: "Percentage of session 'vibes' for your top goals.",
      insight:
        "This chart analyzes the 'vibe' for individual goals. Use it to pinpoint exactly which projects energize you and which ones may need a different approach or breaking down further.",
    },
  };
  const currentConfig = viewConfig[viewMode];

  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;
    const withPercentages = data.map((d) => ({
      ...d,
      flowPct: d.totalSessions > 0 ? d.FLOW / d.totalSessions : 0,
    }));
    const bestFlow = withPercentages.reduce((max, cur) =>
      cur.flowPct > max.flowPct ? cur : max
    );
    return `<strong>${bestFlow.name}</strong> seems to be your greatest source of flow.`;
  }, [data]);

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
      <CardContent>
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as FlowViewMode)}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='goal'>By Goal</TabsTrigger>
            <TabsTrigger value='category'>By Category</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className='mt-4'>
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
                              style={{
                                backgroundColor: chartConfig.FLOW.color,
                              }}
                            />
                            Flow: {dataPoint.FLOW} sessions
                          </li>
                          <li className='flex items-center gap-2'>
                            <span
                              className='h-2.5 w-2.5 rounded-full'
                              style={{
                                backgroundColor: chartConfig.NEUTRAL.color,
                              }}
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
              <Bar
                dataKey='NEUTRAL'
                stackId='a'
                fill={chartConfig.NEUTRAL.color}
              />
              <Bar
                dataKey='STRUGGLE'
                stackId='a'
                fill={chartConfig.STRUGGLE.color}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
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

// 3. Sustainability Report
function BreakDisciplineStats({
  data,
  isLoading,
  isError,
}: {
  data?: PomodoroStatsData;
  isLoading: boolean;
  isError: boolean;
}) {
  const stats = useMemo(() => {
    if (!data || data.WORK === 0) return null;
    const pomodorosPerLongBreak = 4;
    const expectedLongBreaks = Math.floor(data.WORK / pomodorosPerLongBreak);
    const expectedShortBreaks = data.WORK - expectedLongBreaks;
    const shortBreakAdherence =
      expectedShortBreaks > 0
        ? Math.min(data.SHORT_BREAK / expectedShortBreaks, 1)
        : 1;
    const longBreakAdherence =
      expectedLongBreaks > 0
        ? Math.min(data.LONG_BREAK / expectedLongBreaks, 1)
        : 1;

    let overallAdherence;
    if (expectedLongBreaks > 0) {
      const shortBreakWeight = 0.75;
      const longBreakWeight = 0.25;
      overallAdherence =
        shortBreakAdherence * shortBreakWeight +
        longBreakAdherence * longBreakWeight;
    } else {
      overallAdherence = shortBreakAdherence;
    }

    let rating: string;
    let color: string;
    if (overallAdherence >= 0.9) {
      rating = 'Excellent';
      color = 'text-green-500';
    } else if (overallAdherence >= 0.7) {
      rating = 'Good';
      color = 'text-yellow-500';
    } else {
      rating = 'Needs Improvement';
      color = 'text-red-500';
    }
    return {
      ...data,
      adherence: Math.round(overallAdherence * 100),
      rating,
      color,
    };
  }, [data]);

  if (!stats) return null;

  return (
    <div className='flex flex-col sm:flex-row justify-around items-center text-center gap-4'>
      <div className='flex-1'>
        <p className={`text-4xl font-bold ${stats.color}`}>
          {stats.adherence}%
        </p>
        <p className='text-xs font-semibold'>{stats.rating} Adherence</p>
      </div>
      <dl className='flex-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground'>
        <div className='flex flex-col items-center'>
          <dt className='font-medium'>Work</dt>
          <dd className='text-lg font-mono'>{stats.WORK}</dd>
        </div>
        <div className='flex flex-col items-center'>
          <dt className='font-medium'>Short Breaks</dt>
          <dd className='text-lg font-mono'>{stats.SHORT_BREAK}</dd>
        </div>
        <div className='flex flex-col items-center'>
          <dt className='font-medium'>Long Breaks</dt>
          <dd className='text-lg font-mono'>{stats.LONG_BREAK}</dd>
        </div>
      </dl>
    </div>
  );
}

function SustainabilityReport() {
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weeklyChartData = useMemo(() => {
    return DAYS.map((day, index) => {
      const dataPoint = DUMMY_WEEKLY_BALANCE.find((d) => d.dayOfWeek === index);
      return {
        day,
        totalHours: (dataPoint?.totalSeconds ?? 0) / 3600,
        isWeekend: index === 0 || index === 6,
      };
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Work-Life Health</CardTitle>
          <InsightTooltip
            content={
              <>
                <p className='font-medium'>
                  This report is your work-life health check.
                </p>
                <ul className='mt-2 list-disc list-inside space-y-1 text-xs'>
                  <li>
                    <strong>Weekly Balance:</strong> Shows your focus
                    distribution across weekdays vs. weekends.
                  </li>
                  <li>
                    <strong>Break Discipline:</strong> Analyzes how effectively
                    you take breaks during Pomodoro sessions.
                  </li>
                </ul>
                <p className='mt-2'>
                  Use it to prevent burnout and ensure your work habits are
                  sustainable.
                </p>
              </>
            }
          />
        </div>
        <CardDescription>
          Analyzing your work habits from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-8'>
        <div>
          <h4 className='font-semibold text-sm mb-2'>Weekly Focus Balance</h4>
          <ChartContainer
            config={{ hours: { label: 'Hours' } }}
            className='h-[150px] w-full'
          >
            <BarChart
              accessibilityLayer
              data={weeklyChartData}
              margin={{ top: 5, right: 10, left: -20, bottom: -5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='day'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                unit='h'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${Number(value).toFixed(1)} hours`}
                  />
                }
              />
              <Bar dataKey='totalHours' radius={4}>
                {weeklyChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isWeekend ? 'var(--chart-2)' : 'var(--chart-1)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
        <div className='border-t pt-6'>
          <div className='flex items-center gap-2 mb-2'>
            <h4 className='font-semibold text-sm'>Break Discipline</h4>
            <InsightTooltip
              content={
                <>
                  <p>
                    Your adherence score reflects how consistently you take
                    breaks during Pomodoro sessions. A high score means you're
                    respecting the work-rest cycles.
                  </p>
                  <p className='mt-2 text-xs'>
                    <strong>Why it matters:</strong> Deliberate breaks are
                    crucial for maintaining focus, preventing mental fatigue,
                    and consolidating information. Skipping them can lead to
                    burnout and lower quality work over time.
                  </p>
                </>
              }
            />
          </div>
          <BreakDisciplineStats
            data={DUMMY_POMODORO_STATS}
            isLoading={false}
            isError={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// 4. Productivity Hotspot Chart
function ProductivityHotspotChart() {
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;
  const data = DUMMY_HOTSPOT_DATA;
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

  const peakTimeSummary = `Your peak focus time is typically on ${
    DAYS[data.peakTime!.day]
  }s around ${format(new Date(2000, 0, 1, data.peakTime!.hour), 'ha')}.`;

  return (
    <Card>
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
          {format(endDate, 'MMM d')}. Total: {data.totalHours.toFixed(0)} hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={0}>
          <div className='relative flex'>
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
                  const hourLabel = format(
                    new Date(2000, 0, 1, hourIndex),
                    'ha'
                  );
                  return (
                    <Tooltip key={`${dayIndex}-${hourIndex}`}>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
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
      </CardContent>
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
        <p className='w-full pt-2 text-xs text-muted-foreground'>
          {peakTimeSummary}
        </p>
      </CardFooter>
    </Card>
  );
}

// 5. Estimation Accuracy Report
function EstimationAccuracyReport() {
  const [currentPage, setCurrentPage] = useState(1);
  const data =
    currentPage === 1
      ? DUMMY_ESTIMATION_ACCURACY.page1
      : DUMMY_ESTIMATION_ACCURACY.page2;
  const isLoading = false;
  const formatSecondsToHM = (seconds: number): string => {
    if (seconds < 60) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  const processedData: ProcessedAccuracyItem[] = useMemo(() => {
    return data.data.map((item) => {
      const wasEstimated = item.totalEstimatedSeconds > 0;
      if (!wasEstimated) {
        return {
          ...item,
          variancePercent: null,
          isOver: item.totalActualSeconds > 0,
          wasEstimated,
        };
      }
      const variance = item.totalActualSeconds - item.totalEstimatedSeconds;
      const variancePercent = (variance / item.totalEstimatedSeconds) * 100;
      return { ...item, variancePercent, isOver: variance > 0, wasEstimated };
    });
  }, [data]);

  const averageAccuracy = -8.7; // Hardcoded based on dummy data for a disciplined user

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Estimation Accuracy</CardTitle>
          <InsightTooltip
            content={
              <p>
                This report compares your estimated time against the actual time
                you spent on completed goals. Use this feedback to improve your
                planning skills, set more realistic deadlines, and reduce the
                stress of falling behind.
              </p>
            }
          />
        </div>
        <CardDescription>
          Review your planning accuracy to make more realistic estimates in the
          future.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-sm text-muted-foreground border-l-4 rounded p-3 mb-4 bg-muted/50'>
          On average, you tend to{' '}
          <strong
            className={cn(
              averageAccuracy > 0 ? 'text-destructive' : 'text-green-600'
            )}
          >
            {averageAccuracy > 0 ? 'underestimate' : 'overestimate'}
          </strong>{' '}
          by{' '}
          <strong className='text-foreground'>
            {Math.abs(averageAccuracy).toFixed(0)}%
          </strong>
          .
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Completed Goal</TableHead>
              <TableHead className='text-right'>Estimated</TableHead>
              <TableHead className='text-right'>Actual</TableHead>
              <TableHead className='text-right'>Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((item) => (
              <TableRow key={item.goalId}>
                <TableCell scope='row' className='font-medium'>
                  <p className='truncate max-w-xs'>{item.goalTitle}</p>
                  <p className='text-xs text-muted-foreground'>
                    {format(new Date(item.completedAt), 'MMM d, yyyy')}
                  </p>
                </TableCell>
                <TableCell className='text-right'>
                  {formatSecondsToHM(item.totalEstimatedSeconds)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatSecondsToHM(item.totalActualSeconds)}
                </TableCell>
                <TableCell className='text-right flex items-center justify-end'>
                  {!item.wasEstimated ? (
                    <Badge variant='outline' className='text-muted-foreground'>
                      Not Estimated
                    </Badge>
                  ) : (
                    <Badge
                      variant={item.isOver ? 'destructive' : 'default'}
                      className='flex items-center justify-end gap-1'
                    >
                      {item.isOver ? (
                        <TrendingUp className='h-3 w-3' />
                      ) : (
                        <TrendingDown className='h-3 w-3' />
                      )}
                      <span className='sr-only'>
                        {item.isOver ? 'Over estimate by' : 'Under estimate by'}
                      </span>
                      <span>{Math.abs(item.variancePercent!).toFixed(0)}%</span>
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
              >
                <PaginationPrevious className='static' />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button variant='outline' size='sm' className='cursor-default'>
                Page {currentPage} of 2
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setCurrentPage(2)}
                disabled={currentPage >= 2}
              >
                <PaginationNext className='static' />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}

// --- MAIN LANDING PAGE COMPONENT ---

export default function LandingPageAnalytics() {
  return (
    <div className='p-4 md:p-8 bg-background'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <div className='text-center'>
          <h1 className='text-3xl md:text-4xl font-bold tracking-tight'>
            Unlock Your Peak Productivity
          </h1>
          <p className='mt-3 max-w-2xl mx-auto text-lg text-muted-foreground'>
            GridGoal doesn't just track your time. It gives you actionable
            insights to work smarter, not just harder.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <TimeAllocationChart />
          <FlowTriggersChart />
          <SustainabilityReport />
          <ProductivityHotspotChart />
          <div className='lg:col-span-2'>
            <EstimationAccuracyReport />
          </div>
        </div>
      </div>
    </div>
  );
}
