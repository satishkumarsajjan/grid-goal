'use client';

import { useQueries } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Coffee } from 'lucide-react';

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
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

// --- Type Definitions (best practice is to import from the route files) ---
type WeeklyBalanceData = {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  totalSeconds: number;
};

type PomodoroStatsData = {
  WORK: number;
  SHORT_BREAK: number;
  LONG_BREAK: number;
};

// --- Helper Constants ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- API Fetchers ---
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

// --- Main Component ---
export function SustainabilityReport() {
  // Read the date range directly from the global Zustand store.
  const { range } = useAnalyticsStore();
  const { startDate, endDate } = range;

  // useQueries is perfect for fetching multiple, independent data sets for one component.
  // Both queries now use the global date range from the store.
  const [weeklyBalanceQuery, pomodoroStatsQuery] = useQueries({
    queries: [
      {
        queryKey: ['weeklyBalance', { startDate, endDate }],
        queryFn: () => fetchWeeklyBalance(startDate, endDate),
        placeholderData: (previousData) => previousData,
      },
      {
        queryKey: ['pomodoroStats', { startDate, endDate }],
        queryFn: () => fetchPomodoroStats(startDate, endDate),
        placeholderData: (previousData) => previousData,
      },
    ],
  });

  // Process weekly balance data for the chart
  const weeklyChartData = DAYS.map((day, index) => {
    const dataPoint = weeklyBalanceQuery.data?.find(
      (d) => d.dayOfWeek === index
    );
    return {
      day,
      totalHours: (dataPoint?.totalSeconds ?? 0) / 3600,
      // Color weekends differently for visual emphasis
      fill: index === 0 || index === 6 ? 'var(--chart-2)' : 'var(--chart-1)',
    };
  });

  const hasPomodoroData =
    pomodoroStatsQuery.data && pomodoroStatsQuery.data.WORK > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work-Life Health</CardTitle>
        <CardDescription>
          Analyzing your work habits from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Section 1: Weekly Balance Chart */}
        <div>
          <h4 className='font-semibold text-sm mb-2'>Weekly Focus Balance</h4>
          {weeklyBalanceQuery.isLoading ? (
            <Skeleton className='h-[150px] w-full' />
          ) : weeklyBalanceQuery.isError ? (
            <p className='text-destructive text-sm'>
              Could not load balance data.
            </p>
          ) : (
            <ChartContainer config={{}} className='h-[150px] w-full'>
              <BarChart accessibilityLayer data={weeklyChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey='day'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${Number(value).toFixed(1)} hours`}
                    />
                  }
                />
                <Bar dataKey='totalHours' radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        {/* Section 2: Pomodoro Break Discipline */}
        <div className='border-t pt-6'>
          <h4 className='font-semibold text-sm mb-2'>Break Discipline</h4>
          {pomodoroStatsQuery.isLoading ? (
            <Skeleton className='h-12 w-full' />
          ) : pomodoroStatsQuery.isError ? (
            <p className='text-destructive text-sm'>
              Could not load Pomodoro data.
            </p>
          ) : !hasPomodoroData ? (
            <div className='text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg'>
              <Coffee className='mx-auto h-6 w-6 mb-2' />
              Use the Pomodoro timer in this period to analyze your break
              habits.
            </div>
          ) : (
            <div className='flex justify-around text-center'>
              <div>
                <p className='text-2xl font-bold'>
                  {pomodoroStatsQuery.data.WORK}
                </p>
                <p className='text-xs text-muted-foreground'>Work Cycles</p>
              </div>
              <div>
                <p className='text-2xl font-bold'>
                  {pomodoroStatsQuery.data.SHORT_BREAK}
                </p>
                <p className='text-xs text-muted-foreground'>Short Breaks</p>
              </div>
              <div>
                <p className='text-2xl font-bold'>
                  {pomodoroStatsQuery.data.LONG_BREAK}
                </p>
                <p className='text-xs text-muted-foreground'>Long Breaks</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
