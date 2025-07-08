// components/analytics/dummy/SustainabilityReport.dummy.tsx
'use client';

import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Coffee } from 'lucide-react';
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

// --- Types and Helpers ---
type WeeklyBalanceData = { dayOfWeek: number; totalSeconds: number };
type PomodoroStatsData = {
  WORK: number;
  SHORT_BREAK: number;
  LONG_BREAK: number;
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Dummy Data ---
const dummyWeeklyData: WeeklyBalanceData[] = [
  { dayOfWeek: 0, totalSeconds: 3600 },
  { dayOfWeek: 1, totalSeconds: 18000 },
  { dayOfWeek: 2, totalSeconds: 21600 },
  { dayOfWeek: 3, totalSeconds: 19800 },
  { dayOfWeek: 4, totalSeconds: 25200 },
  { dayOfWeek: 5, totalSeconds: 14400 },
  { dayOfWeek: 6, totalSeconds: 5400 },
];
const dummyPomodoroData: PomodoroStatsData = {
  WORK: 42,
  SHORT_BREAK: 35,
  LONG_BREAK: 7,
};
const dummyStartDate = new Date('2023-10-01');
const dummyEndDate = new Date('2023-10-31');

// --- Internal UI Component ---
interface SustainabilityReportUIProps {
  weeklyData?: WeeklyBalanceData[];
  pomodoroData?: PomodoroStatsData;
  isLoading?: boolean;
  isError?: boolean;
  startDate: Date;
  endDate: Date;
}
function SustainabilityReportUI({
  weeklyData,
  pomodoroData,
  isLoading,
  isError,
  startDate,
  endDate,
}: SustainabilityReportUIProps) {
  const weeklyChartData = DAYS.map((day, index) => {
    const dataPoint = weeklyData?.find((d) => d.dayOfWeek === index);
    return {
      day,
      totalHours: (dataPoint?.totalSeconds ?? 0) / 3600,
      fill: index === 0 || index === 6 ? 'var(--chart-2)' : 'var(--chart-1)',
    };
  });
  const hasPomodoroData = pomodoroData && pomodoroData.WORK > 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work-Life Health</CardTitle>
        <CardDescription>
          Habits from {format(startDate, 'MMM d')} to {format(endDate, 'MMM d')}
          .
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <h4 className='font-semibold text-sm mb-2'>Weekly Focus Balance</h4>
          {isLoading ? (
            <Skeleton className='h-[150px] w-full' />
          ) : isError ? (
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
        <div className='border-t pt-6'>
          <h4 className='font-semibold text-sm mb-2'>Break Discipline</h4>
          {isLoading ? (
            <Skeleton className='h-12 w-full' />
          ) : isError ? (
            <p className='text-destructive text-sm'>
              Could not load Pomodoro data.
            </p>
          ) : !hasPomodoroData ? (
            <div className='text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg'>
              <Coffee className='mx-auto h-6 w-6 mb-2' />
              Use the Pomodoro timer.
            </div>
          ) : (
            <div className='flex justify-around text-center'>
              <div>
                <p className='text-2xl font-bold'>{pomodoroData.WORK}</p>
                <p className='text-xs text-muted-foreground'>Work Cycles</p>
              </div>
              <div>
                <p className='text-2xl font-bold'>{pomodoroData.SHORT_BREAK}</p>
                <p className='text-xs text-muted-foreground'>Short Breaks</p>
              </div>
              <div>
                <p className='text-2xl font-bold'>{pomodoroData.LONG_BREAK}</p>
                <p className='text-xs text-muted-foreground'>Long Breaks</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Exported Dummy Components ---
export const SustainabilityReportWithData = () => (
  <SustainabilityReportUI
    weeklyData={dummyWeeklyData}
    pomodoroData={dummyPomodoroData}
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const SustainabilityReportLoading = () => (
  <SustainabilityReportUI
    isLoading
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const SustainabilityReportEmpty = () => (
  <SustainabilityReportUI
    weeklyData={[]}
    pomodoroData={{ WORK: 0, SHORT_BREAK: 0, LONG_BREAK: 0 }}
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
export const SustainabilityReportError = () => (
  <SustainabilityReportUI
    isError
    startDate={dummyStartDate}
    endDate={dummyEndDate}
  />
);
