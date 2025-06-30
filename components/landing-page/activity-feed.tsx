'use client';

import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Dot } from 'lucide-react';
import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { EnterBlur } from '../ui/enter-blur';

// Register the GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// --- TYPE DEFINITIONS and HELPER FUNCTIONS ---
// (No changes here, using your original functions)
type Activity = { date: string; hours: number };
type GridCellData = { date: string; hours: number; level: 0 | 1 | 2 | 3 | 4 };
type MonthData = {
  year: number;
  month: number;
  monthName: string;
  days: (GridCellData | null)[];
};

const generateActivityData = (days = 365): Activity[] => {
  const data: Activity[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const isoDate = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    let hours = 0;
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      const r = Math.random();
      if (r < 0.25) hours = 0;
      else if (r < 0.6) hours = Math.floor(Math.random() * 3) + 1;
      else if (r < 0.9) hours = Math.floor(Math.random() * 4) + 4;
      else hours = Math.floor(Math.random() * 3) + 8;
    } else {
      if (Math.random() < 0.15) hours = Math.floor(Math.random() * 4) + 1;
    }
    data.push({ date: isoDate, hours });
  }
  return data.reverse();
};

const getActivityLevel = (hours: number): 0 | 1 | 2 | 3 | 4 => {
  if (hours === 0) return 0;
  if (hours <= 2) return 1;
  if (hours <= 5) return 2;
  if (hours <= 8) return 3;
  return 4;
};

const getColorClass = (level: 0 | 1 | 2 | 3 | 4): string => {
  const colors = [
    'bg-gray-200 dark:bg-gray-800',
    'bg-green-500/40',
    'bg-green-500/60',
    'bg-green-500/80',
    'bg-green-500',
  ];
  return colors[level];
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// --- MAIN COMPONENT ---
export function TaskActivity() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activityData] = React.useState<Activity[]>(() =>
    generateActivityData(365)
  );

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Set the initial scale of the cells before animating
      gsap.set('.activity-cell', { scale: 0.5 });

      // Animate TO the final state. The initial opacity is handled by CSS.
      gsap.to('.activity-cell', {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        stagger: 0.003,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    },
    { scope: containerRef, dependencies: [activityData] }
  );

  const processedMonths: MonthData[] = React.useMemo(() => {
    // ... (Your memoization logic remains unchanged)
    const activityMap = new Map(activityData.map((a) => [a.date, a.hours]));
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);

    const monthsMap = new Map<string, GridCellData[]>();
    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      if (d > today) continue;
      const dateString = d.toISOString().split('T')[0];
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, []);
      }
      const hours = activityMap.get(dateString) ?? 0;
      monthsMap.get(monthKey)!.push({
        date: dateString,
        hours: hours,
        level: getActivityLevel(hours),
      });
    }

    const result: MonthData[] = [];
    for (const [key, daysInMonth] of monthsMap.entries()) {
      const [year, month] = key.split('-').map(Number);
      const firstDayOfMonth = new Date(year, month, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay();

      const paddedDays = [...Array(firstDayOfWeek).fill(null), ...daysInMonth];

      result.push({
        year,
        month,
        monthName: MONTH_NAMES[month],
        days: paddedDays,
      });
    }
    return result.slice(-12);
  }, [activityData]);

  if (!activityData.length) return <div>Loading activity...</div>;

  return (
    <EnterBlur
      className='my-24 md:my-32'
      aria-labelledby='product-heading'
      delay={1}
    >
      {/* Content remains the same, just wrapped in a section with an ID */}
      <div className='container mx-auto px-6 flex flex-col items-center text-center'>
        <p className='text-primary font-semibold uppercase tracking-wider text-sm'>
          Visualization
        </p>
        <h2
          id='product-heading'
          className='mt-2 text-4xl md:text-5xl font-bold tracking-tighter'
        >
          Your Progress, Solidified.
        </h2>
        <p className='mt-4 text-lg text-muted-foreground max-w-2xl mx-auto'>
          The grid doesn’t lie. It’s the most honest feedback on your
          dedication. Watch your consistency take shape, one day at a time.
        </p>
        <div className='mt-12 flex justify-center'>
          <div className='flex flex-col items-center p-4 sm:p-6 bg-card/15 backdrop-blur-sm rounded-lg border w-full max-w-7xl mx-auto'>
            <div className='w-full text-left mb-4 px-2'>
              <h2 className='text-base font-semibold text-card-foreground'>
                {activityData
                  .reduce((sum, a) => sum + a.hours, 0)
                  .toLocaleString()}{' '}
                hours dedicated in the last 365 days
              </h2>
            </div>

            <div className='w-full flex'>
              {/* Day Labels Column */}
              <div className='hidden shrink-0 pr-4 xl:flex flex-col text-xs text-muted-foreground'>
                <div className='h-7' />
                <div className='flex flex-col'>
                  <span>Sun</span> <span>Mon</span> <span>Tue</span>{' '}
                  <span>Wed</span> <span>Thu</span> <span>Fri</span>{' '}
                  <span>Sat</span>
                </div>
              </div>

              {/* This div contains the cells and has the helper class */}
              <div
                ref={containerRef}
                // The 'invisible-cells' class hides the children until GSAP runs
                className={cn(
                  'invisible-cells grid flex-1 gap-x-3 gap-y-5',
                  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12'
                )}
              >
                {processedMonths.map(({ monthName, days }, monthIndex) => (
                  <div key={monthName + monthIndex}>
                    <div className='text-xs text-muted-foreground h-7 flex items-center justify-center pb-1'>
                      {monthName}
                    </div>
                    <div className='grid grid-rows-7 grid-flow-col gap-1'>
                      {days.map((cell, dayIndex) => {
                        if (!cell)
                          return (
                            <div key={`pad-${dayIndex}`} className='size-3' />
                          );

                        const { date, hours, level } = cell;
                        const formattedDate = new Date(date).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        );
                        const tooltipText =
                          hours > 0
                            ? `${hours} hour${
                                hours > 1 ? 's' : ''
                              } on ${formattedDate}`
                            : `No activity on ${formattedDate}`;

                        return (
                          <TooltipProvider key={date} delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'activity-cell size-3 rounded-xs cursor-pointer hover:border-2 border-foreground',
                                    getColorClass(level)
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{tooltipText}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='w-full flex items-center justify-between mt-4'>
              <p className='flex items-center justify-center text-center text-xs text-muted-foreground'>
                <Dot /> Hover on the cells to know more
              </p>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>Less</span>
                <div className='flex gap-1'>
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'size-3 rounded-xs',
                        getColorClass(level as 0 | 1 | 2 | 3 | 4)
                      )}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EnterBlur>
  );
}
