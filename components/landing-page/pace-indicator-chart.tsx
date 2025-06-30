'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const paceData = [
  { week: 'Week 1', idealPace: 10, actualPace: 8 },
  { week: 'Week 2', idealPace: 20, actualPace: 22 },
  { week: 'Week 3', idealPace: 30, actualPace: 29 },
  { week: 'Week 4', idealPace: 40, actualPace: 41 },
];

const chartConfig = {
  actualPace: {
    label: 'Actual Pace',
    color: 'hsl(210, 90%, 60%)',
  },
  idealPace: {
    label: 'Ideal Pace',
    color: 'hsl(240, 4%, 60%)',
  },
} satisfies ChartConfig;

export function PaceIndicatorChart({ compact = false }: { compact?: boolean }) {
  const finalDataPoint = paceData[paceData.length - 1];
  const finalDifference = finalDataPoint.actualPace - finalDataPoint.idealPace;
  const status =
    finalDifference >= 0
      ? {
          text: `You're ${finalDifference}h ahead`,
          icon: <TrendingUp className='h-4 w-4' />,
          color: 'text-primary',
        }
      : {
          text: `You're ${Math.abs(finalDifference)}h behind`,
          icon: <TrendingDown className='h-4 w-4 text-destructive' />,
          color: 'text-destructive',
        };

  const ChartContentComponent = () => (
    <>
      <CardHeader className={compact ? 'p-0 pb-2' : ''}>
        <CardTitle className={compact ? 'text-sm' : ''}>
          Pace Indicator
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'p-0' : ''}>
        <ChartContainer config={chartConfig} className='h-full w-full'>
          <LineChart
            accessibilityLayer
            data={paceData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5, // Changed from -10 to 5
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray='3 3'
              stroke='hsl(var(--border) / 0.5)'
            />
            <XAxis
              dataKey='week'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => `${value}h`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Line
              dataKey='idealPace'
              type='monotone'
              stroke='var(--color-idealPace)'
              strokeWidth={2}
              strokeDasharray='4 4'
              dot={false}
            />
            <Line
              dataKey='actualPace'
              type='natural'
              stroke='var(--color-actualPace)'
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{
                r: 8,
                style: {
                  stroke: 'var(--color-actualPace)',
                  fill: 'hsl(var(--background))',
                },
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className={compact ? 'p-0 pt-2' : ''}>
        <div
          className={`flex items-center gap-2 text-xs font-medium leading-none ${status.color}`}
        >
          {status.icon} {status.text}
        </div>
      </CardFooter>
    </>
  );

  if (compact) {
    return (
      <div className='w-full h-full flex flex-col justify-between'>
        <ChartContentComponent />
      </div>
    );
  }

  return (
    <Card>
      <ChartContentComponent />
    </Card>
  );
}
