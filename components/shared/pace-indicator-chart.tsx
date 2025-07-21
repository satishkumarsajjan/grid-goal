'use client';

import { Badge, badgeVariants } from '@/components/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { VariantProps } from 'class-variance-authority';
import { differenceInCalendarDays, startOfToday } from 'date-fns';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

interface PaceDataPoint {
  date: string;
  targetPace: number;
  actualPace: number | null;
}
interface PaceProgressChartProps {
  data: PaceDataPoint[];
}

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const chartConfig = {
  targetPace: { label: 'Target Pace', color: 'var(--chart-2)' },
  actualPace: { label: 'Actual Pace', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const getPaceStatus = (data: PaceDataPoint[]) => {
  // Find the last point with actual data for a more robust status
  const lastDataPointWithActuals = [...data]
    .reverse()
    .find((d) => d.actualPace !== null);

  if (!lastDataPointWithActuals) {
    return {
      status: 'Not Started',
      variant: 'secondary' as BadgeVariant,
      Icon: Minus,
    };
  }

  const { actualPace, targetPace, date } = lastDataPointWithActuals;

  const daysIntoGoal =
    differenceInCalendarDays(new Date(date), new Date(data[0].date)) || 1;
  const hoursPerDay = targetPace / daysIntoGoal;

  const diffHours = actualPace! - targetPace;

  const onPaceThreshold = hoursPerDay / 2;

  if (diffHours > onPaceThreshold) {
    const diffDays = Math.abs(diffHours / hoursPerDay);
    return {
      status: `~${diffDays.toFixed(0)}d Ahead`,
      variant: 'success' as BadgeVariant,
      Icon: TrendingUp,
    };
  }
  if (diffHours < -onPaceThreshold) {
    const diffDays = Math.abs(diffHours / hoursPerDay);
    return {
      status: `~${diffDays.toFixed(0)}d Behind`,
      variant: 'destructive' as BadgeVariant,
      Icon: TrendingDown,
    };
  }
  return { status: 'On Pace', variant: 'default' as BadgeVariant, Icon: Minus };
};

export function PaceProgressChart({ data }: PaceProgressChartProps) {
  const paceStatus = useMemo(() => getPaceStatus(data), [data]);

  if (!data || data.length === 0) {
    return (
      <div className='flex h-[250px] w-full items-center justify-center rounded-lg border border-dashed text-center'>
        <div>
          <h3 className='text-lg font-semibold'>Pace Chart Not Available</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Add a deadline and time estimates to your tasks to see your
            progress.
          </p>
        </div>
      </div>
    );
  }

  const screenReaderSummary = `Pace chart showing progress for your goal. You are currently ${paceStatus.status.replace(
    '~',
    'approximately '
  )}.`;

  return (
    <div className='relative'>
      <div className='absolute -top-4 right-4 z-10'>
        <Badge variant={paceStatus.variant} className='flex items-center gap-1'>
          <paceStatus.Icon className='h-3 w-3' />
          <span>{paceStatus.status}</span>
        </Badge>
      </div>
      <div className='sr-only' aria-live='polite'>
        {screenReaderSummary}
      </div>
      <ChartContainer config={chartConfig} className='h-[250px] w-full'>
        <LineChart
          desc="A line chart comparing your actual hours completed versus the target pace over the goal's timeline."
          accessibilityLayer
          data={data}
          margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='date'
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            }
            label={{
              value: 'Goal Timeline',
              position: 'insideBottom',
              offset: -15,
              style: { textAnchor: 'middle' },
            }}
          />
          <YAxis
            label={{
              value: 'Hours Completed',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              offset: -5,
            }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${Math.round(value)}h`}
          />
          <ChartTooltip
            cursor
            content={
              <ChartTooltipContent
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                }
                formatter={(value) =>
                  `${typeof value === 'number' ? value.toFixed(1) : value} hrs`
                }
                indicator='line'
              />
            }
          />
          <ReferenceLine
            x={startOfToday().toISOString().split('T')[0]}
            stroke='var(--foreground)'
            strokeDasharray='3 3'
            strokeWidth={1}
          />
          <Line
            dataKey='targetPace'
            type='natural'
            stroke='var(--color-targetPace)'
            strokeWidth={2}
            strokeDasharray='4 4'
            dot={false}
          />
          <Line
            dataKey='actualPace'
            type='natural'
            stroke='var(--color-actualPace)'
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
