'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface PaceDataPoint {
  date: string;
  targetPace: number;
  actualPace: number | null;
}

interface PaceProgressChartProps {
  data: PaceDataPoint[];
}

const chartConfig = {
  targetPace: {
    label: 'Target Pace',
    color: 'var(--chart-2)',
  },
  actualPace: {
    label: 'Actual Pace',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function PaceProgressChart({ data }: PaceProgressChartProps) {
  return (
    <ChartContainer config={chartConfig} className='h-[250px] w-full'>
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
          top: 10,
          bottom: 20,
        }}
      >
        <defs>
          <linearGradient id='fillTargetPace' x1='0' y1='0' x2='0' y2='1'>
            <stop
              offset='5%'
              stopColor='var(--color-targetPace)'
              stopOpacity={0.4}
            />
            <stop
              offset='95%'
              stopColor='var(--color-targetPace)'
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id='fillActualPace' x1='0' y1='0' x2='0' y2='1'>
            <stop
              offset='5%'
              stopColor='var(--color-actualPace)'
              stopOpacity={0.8}
            />
            <stop
              offset='95%'
              stopColor='var(--color-actualPace)'
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} />

        <XAxis
          dataKey='date'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          }}
          label={{
            value: 'Goal Timeline',
            position: 'insideBottom',
            offset: -15,
            style: { textAnchor: 'middle' },
          }}
        />

        <YAxis
          // This label is important for context!
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
              labelFormatter={(label) => {
                return new Date(label).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              }}
              formatter={(value) =>
                `${typeof value === 'number' ? value.toFixed(1) : value} hrs`
              }
              indicator='line'
            />
          }
        />

        {/* The "Target Pace" line - dashed to indicate it's a guide */}
        <Area
          dataKey='targetPace'
          type='natural'
          fill='url(#fillTargetPace)'
          stroke='var(--color-targetPace)'
          strokeWidth={2}
          strokeDasharray='4 4'
          dot={false}
        />

        <Area
          dataKey='actualPace'
          type='natural'
          fill='url(#fillActualPace)'
          stroke='var(--color-actualPace)'
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
