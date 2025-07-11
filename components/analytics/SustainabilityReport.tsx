'use client';

import { keepPreviousData, useQueries } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Coffee } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

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
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { InsightTooltip } from './InsightTooltip';

type WeeklyBalanceData = {
  dayOfWeek: number;
  totalSeconds: number;
};
type PomodoroStatsData = {
  WORK: number;
  SHORT_BREAK: number;
  LONG_BREAK: number;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fetchWeeklyBalance = async (
  startDate: Date,
  endDate: Date
): Promise<WeeklyBalanceData[]> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const { data } = await axios.get(
    `/api/analytics/weekly-balance?${params.toString()}`
  );
  return data;
};
const fetchPomodoroStats = async (
  startDate: Date,
  endDate: Date
): Promise<PomodoroStatsData> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const { data } = await axios.get(
    `/api/analytics/pomodoro-stats?${params.toString()}`
  );
  return data;
};

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
    const expectedShortBreaks = data.WORK - Math.floor(data.WORK / 4);
    const expectedLongBreaks = Math.floor(data.WORK / 4);
    const shortBreakAdherence =
      expectedShortBreaks > 0
        ? Math.min(data.SHORT_BREAK / expectedShortBreaks, 1)
        : 1;
    const longBreakAdherence =
      expectedLongBreaks > 0
        ? Math.min(data.LONG_BREAK / expectedLongBreaks, 1)
        : 1;
    const overallAdherence =
      expectedLongBreaks > 0
        ? shortBreakAdherence * 0.75 + longBreakAdherence * 0.25
        : shortBreakAdherence;
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

  if (isLoading)
    return (
      <div className='flex justify-around'>
        <Skeleton className='h-12 w-1/4' />
        <Skeleton className='h-12 w-1/4' />
        <Skeleton className='h-12 w-1/4' />
      </div>
    );
  if (isError)
    return (
      <p className='text-destructive text-sm text-center'>
        Could not load Pomodoro data.
      </p>
    );
  if (!stats) {
    return (
      <div className='text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg'>
        <Coffee className='mx-auto h-6 w-6 mb-2' />
        Use the Pomodoro timer to analyze your break habits.
      </div>
    );
  }

  return (
    <div className='flex flex-col sm:flex-row justify-around items-center text-center gap-4'>
      <div className='flex-1'>
        <p className={`text-4xl font-bold ${stats.color}`}>
          {stats.adherence}%
        </p>
        <p className='text-xs font-semibold'>{stats.rating} Adherence</p>
      </div>
      <dl className='flex-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-8'>
        <div className='flex flex-col'>
          <dt className='font-medium'>Work</dt>
          <dd className='text-lg font-mono'>{stats.WORK}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='font-medium'>Short Breaks</dt>
          <dd className='text-lg font-mono'>{stats.SHORT_BREAK}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='font-medium'>Long Breaks</dt>
          <dd className='text-lg font-mono'>{stats.LONG_BREAK}</dd>
        </div>
      </dl>
    </div>
  );
}

export function SustainabilityReport() {
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  const [weeklyBalanceQuery, pomodoroStatsQuery] = useQueries({
    queries: [
      {
        queryKey: ['weeklyBalance', { startDate, endDate }],
        queryFn: () => fetchWeeklyBalance(startDate, endDate),
        placeholderData: keepPreviousData,
      },
      {
        queryKey: ['pomodoroStats', { startDate, endDate }],
        queryFn: () => fetchPomodoroStats(startDate, endDate),
        placeholderData: keepPreviousData,
      },
    ],
  });

  const weeklyChartData = useMemo(() => {
    return DAYS.map((day, index) => {
      const dataPoint = weeklyBalanceQuery.data?.find(
        (d) => d.dayOfWeek === index
      );
      return {
        day,
        totalHours: (dataPoint?.totalSeconds ?? 0) / 3600,
        isWeekend: index === 0 || index === 6,
      };
    });
  }, [weeklyBalanceQuery.data]);

  const screenReaderSummary = `Work-Life Health Report from ${format(
    startDate,
    'MMM d'
  )} to ${format(
    endDate,
    'MMM d'
  )}. This report analyzes your weekly focus distribution and your break discipline when using the Pomodoro timer.`;

  return (
    <Card>
      <div className='sr-only' aria-live='polite'>
        {screenReaderSummary}
      </div>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Work-Life Health</CardTitle>
          <InsightTooltip
            content={
              <>
                {' '}
                <p className='font-medium'>
                  This report is your work-life health check.
                </p>{' '}
                <ul className='mt-2 list-disc list-inside space-y-1 text-xs'>
                  {' '}
                  <li>
                    <strong>Weekly Balance:</strong> Shows your focus
                    distribution across weekdays vs. weekends.
                  </li>{' '}
                  <li>
                    <strong>Break Discipline:</strong> Analyzes how effectively
                    you take breaks during Pomodoro sessions.
                  </li>{' '}
                </ul>{' '}
                <p className='mt-2'>
                  Use it to prevent burnout and ensure your work habits are
                  sustainable.
                </p>{' '}
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
          {weeklyBalanceQuery.isLoading ? (
            <Skeleton className='h-[150px] w-full' />
          ) : weeklyBalanceQuery.isError ? (
            <p className='text-destructive text-sm'>
              Could not load balance data.
            </p>
          ) : (
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
                      fill={
                        entry.isWeekend ? 'var(--chart-2)' : 'var(--chart-1)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
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
            data={pomodoroStatsQuery.data}
            isLoading={pomodoroStatsQuery.isLoading}
            isError={pomodoroStatsQuery.isError}
          />
        </div>
      </CardContent>
    </Card>
  );
}
