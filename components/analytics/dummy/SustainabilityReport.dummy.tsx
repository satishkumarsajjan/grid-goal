// components/analytics/dummy/SustainabilityReport.dummy.tsx
'use client';

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
import { format } from 'date-fns';
import { Coffee } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

// --- Types and Helpers (Copied from real component) ---
type WeeklyBalanceData = { dayOfWeek: number; totalSeconds: number };
type PomodoroStatsData = {
  WORK: number;
  SHORT_BREAK: number;
  LONG_BREAK: number;
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Dummy Data ---
// Scenario 1: A disciplined user
const dummyWeeklyDataGood: WeeklyBalanceData[] = [
  { dayOfWeek: 0, totalSeconds: 3600 },
  { dayOfWeek: 1, totalSeconds: 18000 },
  { dayOfWeek: 2, totalSeconds: 21600 },
  { dayOfWeek: 3, totalSeconds: 19800 },
  { dayOfWeek: 4, totalSeconds: 25200 },
  { dayOfWeek: 5, totalSeconds: 14400 },
  { dayOfWeek: 6, totalSeconds: 5400 },
];
const dummyPomodoroDataGood: PomodoroStatsData = {
  WORK: 42,
  SHORT_BREAK: 38,
  LONG_BREAK: 10,
}; // Excellent adherence

// Scenario 2: A user who skips breaks
const dummyPomodoroDataNeedsImprovement: PomodoroStatsData = {
  WORK: 50,
  SHORT_BREAK: 15,
  LONG_BREAK: 2,
}; // Poor adherence

// --- Sub-component for Break Discipline (Dummy Version) ---
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
    const shortBreakAdherence = Math.min(
      data.SHORT_BREAK / expectedShortBreaks,
      1
    );
    const longBreakAdherence = Math.min(
      data.LONG_BREAK / expectedLongBreaks,
      1
    );
    const overallAdherence =
      shortBreakAdherence * 0.75 + longBreakAdherence * 0.25;
    let rating: string, color: string;
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
  if (!stats)
    return (
      <div className='text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg'>
        <Coffee className='mx-auto h-6 w-6 mb-2' />
        Use the Pomodoro timer.
      </div>
    );
  return (
    <div className='flex flex-col sm:flex-row justify-around items-center text-center gap-4'>
      <div className='flex-1'>
        <p className={`text-4xl font-bold ${stats.color}`}>
          {stats.adherence}%
        </p>
        <p className='text-xs font-semibold'>{stats.rating} Adherence</p>
      </div>
      <dl className='flex-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground'>
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

// --- Main UI Component (Purely for Presentation) ---
interface SustainabilityReportUIProps {
  weeklyData?: WeeklyBalanceData[];
  pomodoroData?: PomodoroStatsData;
  isLoading?: boolean;
  isError?: boolean;
}
function SustainabilityReportUI({
  weeklyData,
  pomodoroData,
  isLoading,
  isError,
}: SustainabilityReportUIProps) {
  const startDate = new Date('2023-10-01');
  const endDate = new Date('2023-10-31');
  const weeklyChartData = useMemo(() => {
    return DAYS.map((day, index) => {
      const dataPoint = weeklyData?.find((d) => d.dayOfWeek === index);
      return {
        day,
        totalHours: (dataPoint?.totalSeconds ?? 0) / 3600,
        isWeekend: index === 0 || index === 6,
      };
    });
  }, [weeklyData]);

  return (
    <Card>
      <div className='sr-only'>Dummy screen reader summary.</div>
      <CardHeader>
        <CardTitle>Work-Life Health</CardTitle>
        <CardDescription>
          Analyzing your work habits from {format(startDate, 'MMM d')} to{' '}
          {format(endDate, 'MMM d')}.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-8'>
        <div>
          <h4 className='font-semibold text-sm mb-2'>Weekly Focus Balance</h4>
          {isLoading ? (
            <Skeleton className='h-[150px] w-full' />
          ) : isError ? (
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
                margin={{ top: 5, right: 10, left: -10, bottom: -5 }}
              >
                <defs>
                  <pattern
                    id='weekendPattern'
                    patternUnits='userSpaceOnUse'
                    width='4'
                    height='4'
                  >
                    <path
                      d='M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2'
                      style={{ stroke: 'var(--chart-2)', strokeWidth: 1 }}
                    />
                  </pattern>
                </defs>
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
                        entry.isWeekend
                          ? 'url(#weekendPattern)'
                          : 'var(--chart-1)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </div>
        <div className='border-t pt-6'>
          <h4 className='font-semibold text-sm mb-2'>Break Discipline</h4>
          <BreakDisciplineStats
            data={pomodoroData}
            isLoading={isLoading as boolean}
            isError={isError as boolean}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// --- EXPORTED DUMMY COMPONENTS FOR TESTING ---

/** Displays the report for a user with excellent break habits. */
export const SustainabilityReportGood = () => (
  <SustainabilityReportUI
    weeklyData={dummyWeeklyDataGood}
    pomodoroData={dummyPomodoroDataGood}
  />
);

/** Displays the report for a user who needs to improve their break habits. */
export const SustainabilityReportNeedsImprovement = () => (
  <SustainabilityReportUI
    weeklyData={dummyWeeklyDataGood}
    pomodoroData={dummyPomodoroDataNeedsImprovement}
  />
);

/** Displays the report for a user who has not used the Pomodoro timer. */
export const SustainabilityReportNoPomodoro = () => (
  <SustainabilityReportUI
    weeklyData={dummyWeeklyDataGood}
    pomodoroData={{ WORK: 0, SHORT_BREAK: 0, LONG_BREAK: 0 }}
  />
);

/** Displays the report in its loading state. */
export const SustainabilityReportLoading = () => (
  <SustainabilityReportUI isLoading />
);

/** Displays the report in a full error state. */
export const SustainabilityReportError = () => (
  <SustainabilityReportUI isError />
);
