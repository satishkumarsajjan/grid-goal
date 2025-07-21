'use client';

import { type GoalSummaryData } from '@/app/api/goals/[goalId]/summary/route';
import { type SessionVibe } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format, formatDistanceStrict, isSameDay } from 'date-fns';
import { Calendar, Clock, Gauge, Hash, Sparkles, Trophy } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';

const fetchGoalSummary = async (goalId: string): Promise<GoalSummaryData> => {
  const { data } = await axios.get(`/api/goals/${goalId}/summary`);
  return data;
};

const formatDuration = (seconds: number, concise = false): string => {
  if (!seconds || seconds <= 0) return concise ? '0m' : '0 minutes';

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (concise) {
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(' ') || '0m';
  }

  const parts = [];
  if (h > 0) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
  return parts.join(' ');
};

const VIBE_INFO: Record<SessionVibe, { fill: string }> = {
  FLOW: { fill: 'var(--chart-3)' },
  NEUTRAL: { fill: 'var(--chart-4)' },
  STRUGGLE: { fill: 'var(--chart-5)' },
};

const generateInsight = (summary: GoalSummaryData): string => {
  const totalSessions = summary.totalSessions;
  if (totalSessions < 3 && summary.totalTasksCompleted > 0)
    return 'You completed this goal quickly! Consistent, short bursts of effort can lead to great results.';
  if (totalSessions === 0)
    return 'You achieved this goal without logging any focus time, a testament to your prior efforts!';

  const flowPercentage = (summary.vibeCounts.FLOW / totalSessions) * 100;
  const strugglePercentage =
    (summary.vibeCounts.STRUGGLE / totalSessions) * 100;

  if (flowPercentage > 60)
    return `An impressive ${Math.round(
      flowPercentage
    )}% of your sessions were in a state of Flow. This goal was clearly a great fit for your skills and interests!`;
  if (strugglePercentage > 40)
    return `Over ${Math.round(
      strugglePercentage
    )}% of sessions felt like a struggle. Reflect on what made this goal challenging to better plan for similar objectives in the future.`;

  const firstDay = summary.dailyActivity[0]?.date;
  const lastDay = summary.dailyActivity[summary.dailyActivity.length - 1]?.date;
  if (firstDay && lastDay) {
    const firstDate = new Date(firstDay);
    const lastDate = new Date(lastDay);

    // Handle the "single day" case for a better message.
    if (isSameDay(firstDate, lastDate)) {
      return "You accomplished this entire goal in a single day of focused effort. That's impressive!";
    }

    const duration = formatDistanceStrict(lastDate, firstDate);
    if (duration)
      return `You maintained focus on this goal over a period of ${duration}, demonstrating excellent persistence and dedication.`;
  }
  return "Every completed goal is a step forward. Reflect on what you've learned and carry that wisdom to your next challenge.";
};

export function ArchivedGoalSummary({ goalId }: { goalId: string }) {
  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery<GoalSummaryData>({
    queryKey: ['goalSummary', goalId],
    queryFn: () => fetchGoalSummary(goalId),
  });

  if (isLoading) return <SummarySkeleton />;
  if (isError || !summary)
    return <p className='text-destructive p-6'>Could not load goal summary.</p>;

  const insight = generateInsight(summary);
  const {
    dailyActivity,
    vibeCounts,
    modeCounts,
    totalSessions,
    totalFocusSeconds,
  } = summary;
  const mostProductiveDay =
    dailyActivity.length > 0
      ? [...dailyActivity].sort((a, b) => b.seconds - a.seconds)[0]
      : null;
  const avgSessionLength =
    totalSessions > 0 ? totalFocusSeconds / totalSessions : 0;
  const pomodoroPct =
    totalSessions > 0 ? (modeCounts.POMODORO / totalSessions) * 100 : 0;
  const vibeChartData = Object.entries(vibeCounts)
    .map(([name, count]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
      count,
      fill: VIBE_INFO[name as SessionVibe].fill,
    }))
    .filter((v) => v.count > 0);
  const activityChartData = dailyActivity.map((d) => ({
    date: format(new Date(d.date), 'MMM d'),
    Hours: parseFloat((d.seconds / 3600).toFixed(1)),
  }));

  return (
    <div className='bg-muted/30 h-full flex flex-col overflow-hidden'>
      {/* Fixed header that doesn't scroll */}
      <header className='text-center p-6 flex-shrink-0 border-b bg-background/50 backdrop-blur-sm'>
        <Trophy
          className='mx-auto h-12 w-12 text-amber-400 mb-2'
          strokeWidth={1.5}
        />
        <h1 className='text-3xl font-bold tracking-tight'>{summary.title}</h1>
        <p className='text-muted-foreground mt-1'>
          Completed on {format(new Date(summary.completedAt), 'MMMM d, yyyy')}
        </p>
      </header>

      {/* Scrollable content area */}
      <div className='flex-1 min-h-0'>
        <ScrollArea className='h-full'>
          <div className='max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <StatCard
                icon={Clock}
                label='Total Focus Time'
                value={formatDuration(totalFocusSeconds, true)}
              />
              <StatCard
                icon={Hash}
                label='Focus Sessions'
                value={summary.totalSessions.toString()}
              />
              <StatCard
                icon={Gauge}
                label='Avg. Session Length'
                value={formatDuration(avgSessionLength, true)}
              />
              {mostProductiveDay && (
                <StatCard
                  icon={Calendar}
                  label='Most Productive Day'
                  value={format(new Date(mostProductiveDay.date), 'MMM d')}
                  subValue={formatDuration(mostProductiveDay.seconds, true)}
                />
              )}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Focus Timeline</CardTitle>
                  <CardDescription>
                    Your daily work distribution.
                  </CardDescription>
                </CardHeader>
                <CardContent className='pl-0'>
                  <ResponsiveContainer width='100%' height={250}>
                    <BarChart
                      data={activityChartData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id='timeGradient'
                          x1='0'
                          y1='0'
                          x2='0'
                          y2='1'
                        >
                          <stop
                            offset='5%'
                            stopColor='var(--primary)'
                            stopOpacity={0.8}
                          />
                          <stop
                            offset='95%'
                            stopColor='var(--primary)'
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey='date'
                        stroke='#888888'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke='#888888'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--accent)' }}
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Bar
                        dataKey='Hours'
                        fill='url(#timeGradient)'
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Work Style & Vibe</CardTitle>
                  <CardDescription>
                    How you worked and how it felt.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6 pt-4'>
                  <h4 className='text-sm font-semibold mb-2'>Method</h4>
                  <div className='flex items-center gap-4 text-sm'>
                    <span className='w-24 text-muted-foreground'>Pomodoro</span>
                    <Progress value={pomodoroPct} className='flex-1' />
                    <span className='font-mono w-12 text-right'>
                      {Math.round(pomodoroPct)}%
                    </span>
                  </div>
                  <div className='flex items-center gap-4 text-sm mt-2'>
                    <span className='w-24 text-muted-foreground'>
                      Stopwatch
                    </span>
                    <Progress value={100 - pomodoroPct} className='flex-1' />
                    <span className='font-mono w-12 text-right'>
                      {100 - Math.round(pomodoroPct)}%
                    </span>
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold mb-3'>
                      Vibe Breakdown (%)
                    </h4>
                    <ResponsiveContainer width='100%' height={100}>
                      <BarChart
                        data={vibeChartData}
                        layout='vertical'
                        barCategoryGap='20%'
                      >
                        <XAxis type='number' hide domain={[0, 100]} />
                        <YAxis
                          dataKey='name'
                          type='category'
                          axisLine={false}
                          tickLine={false}
                          width={60}
                          stroke='#888888'
                          fontSize={12}
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--accent)' }}
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                          }}
                          formatter={(value, name, props) => [
                            <div
                              key='sessions'
                              className='flex items-center justify-between gap-3 text-muted-foreground'
                            >
                              <span className='text-sm '>Sessions:</span>
                              <span className='font-semibold'>
                                {props.payload.count}
                              </span>
                            </div>,
                          ]}
                        />
                        <Bar dataKey='value' radius={[0, 4, 4, 0]}>
                          {vibeChartData.map((entry) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={entry.fill}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {insight && (
              <Card className='max-w-3xl mx-auto mt-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20'>
                <CardContent className='pt-6'>
                  <div className='flex items-start gap-4'>
                    <Sparkles className='h-6 w-6 text-primary flex-shrink-0' />
                    <div>
                      <h4 className='font-semibold'>Reflection Prompt</h4>
                      <p className='text-muted-foreground text-sm mt-1'>
                        {insight}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Helper component for stats
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className='p-4 bg-card rounded-lg border h-full flex flex-col items-center justify-center text-center'>
      <Icon className='h-6 w-6 text-muted-foreground mb-2' strokeWidth={1.5} />
      <p className='text-2xl font-bold'>{value}</p>
      {subValue && (
        <p className='text-sm font-semibold text-primary -mt-1'>{subValue}</p>
      )}
      <p className='text-xs text-muted-foreground mt-1'>{label}</p>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className='h-full flex flex-col overflow-hidden'>
      <div className='p-6 flex-shrink-0 border-b'>
        <div className='text-center animate-pulse'>
          <Skeleton className='h-12 w-12 rounded-full mx-auto mb-4' />
          <Skeleton className='h-10 w-3/4 mx-auto' />
          <Skeleton className='h-5 w-1/3 mx-auto mt-2' />
        </div>
      </div>
      <div className='flex-1 min-h-0'>
        <ScrollArea className='h-full'>
          <div className='p-4 sm:p-6 animate-pulse'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-6'>
              <Skeleton className='h-32 rounded-lg' />
              <Skeleton className='h-32 rounded-lg' />
              <Skeleton className='h-32 rounded-lg' />
              <Skeleton className='h-32 rounded-lg' />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto'>
              <Skeleton className='h-80 rounded-lg' />
              <Skeleton className='h-80 rounded-lg' />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
