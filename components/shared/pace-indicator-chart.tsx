'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Type for the data points our chart component receives.
interface PaceDataPoint {
  date: string;
  ideal: number | null;
  actual: number | null;
}

interface PaceIndicatorChartProps {
  data: PaceDataPoint[];
}

export function PaceIndicatorChart({ data }: PaceIndicatorChartProps) {
  return (
    <div className='h-24 w-full -ml-4'>
      {' '}
      {/* Negative margin to align with grid */}
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id='colorActual' x1='0' y1='0' x2='0' y2='1'>
              <stop
                offset='5%'
                stopColor='hsl(var(--primary))'
                stopOpacity={0.4}
              />
              <stop
                offset='95%'
                stopColor='hsl(var(--primary))'
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id='colorIdeal' x1='0' y1='0' x2='0' y2='1'>
              <stop
                offset='5%'
                stopColor='hsl(var(--muted-foreground))'
                stopOpacity={0.2}
              />
              <stop
                offset='95%'
                stopColor='hsl(var(--muted-foreground))'
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='hsl(var(--border))'
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey='date'
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            hide
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--popover-foreground))',
              fontSize: '12px',
              borderRadius: '0.5rem',
            }}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            }
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}h`,
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Area
            type='monotone'
            dataKey='ideal'
            stroke='hsl(var(--muted-foreground))'
            fill='url(#colorIdeal)'
            strokeWidth={2}
            dot={false}
          />
          <Area
            type='monotone'
            dataKey='actual'
            stroke='hsl(var(--primary))'
            fill='url(#colorActual)'
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
