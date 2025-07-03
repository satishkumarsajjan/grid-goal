'use client';

import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as React from 'react';
import { EnterBlur } from '../ui/enter-blur';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import useDeviceDetect from '@/lib/hooks/use-hover-support';

gsap.registerPlugin(ScrollTrigger);

type GridCellData = {
  date: string;
  totalSeconds: number;
  level: 0 | 1 | 2 | 3 | 4;
};
type MonthData = {
  year: number;
  month: number;
  monthName: string;
  days: (GridCellData | null)[];
};

interface ActivityGridProps {
  totalHours: number;
  processedMonths: MonthData[];
}

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

const formatFocusTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return 'No activity';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (hours === 0 && minutes === 0) return 'Less than a minute';
  return parts.join(' ');
};

export function ActivityGrid({
  totalHours,
  processedMonths,
}: ActivityGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { isTouch } = useDeviceDetect();

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.set('.activity-cell', { scale: 0.5, opacity: 0 });
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
    { scope: containerRef, dependencies: [processedMonths] }
  );

  if (!processedMonths.length)
    return (
      <div className='text-center p-8 bg-card rounded-lg border'>
        No activity to display yet. Start a focus session!
      </div>
    );

  return (
    <EnterBlur
      className='my-24 md:my-32'
      aria-labelledby='product-heading'
      delay={1}
    >
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
                {totalHours.toLocaleString()} hours dedicated in the last year
              </h2>
            </div>
            <div className='w-full flex'>
              <div className='hidden shrink-0 pr-4 xl:flex flex-col text-xs text-muted-foreground justify-around'>
                <span className='h-3'></span>
                <span className='h-3'>Sun</span>
                <span className='h-3'></span>
                <span className='h-3'>Mon</span>
                <span className='h-3'></span>
                <span className='h-3'>Tue</span>
                <span className='h-3'></span>
                <span className='h-3'>Wed</span>
                <span className='h-3'></span>
                <span className='h-3'>Thu</span>
                <span className='h-3'></span>
                <span className='h-3'>Fri</span>
                <span className='h-3'></span>
                <span className='h-3'>Sat</span>
                <span className='h-3'></span>
              </div>
              <div
                ref={containerRef}
                className={cn(
                  'grid flex-1 gap-x-3 gap-y-5',
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
                        const { date, totalSeconds, level } = cell;
                        const formattedDate = new Date(date).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'UTC',
                          }
                        );
                        const timeText = formatFocusTime(totalSeconds);
                        const tooltipText =
                          timeText === 'No activity'
                            ? `${timeText} on ${formattedDate}`
                            : `${timeText} of focus on ${formattedDate}`;
                        return (
                          <div key={date}>
                            {!isTouch ? (
                              <TooltipProvider key={date} delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'activity-cell size-3 rounded-sm cursor-pointer opacity-0 hover:border-2 border-foreground',
                                        getColorClass(level)
                                      )}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{tooltipText}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Popover key={date}>
                                <PopoverTrigger asChild>
                                  <div
                                    className={cn(
                                      'activity-cell size-3 rounded-sm cursor-pointer opacity-0 hover:border-2 border-foreground',
                                      getColorClass(level)
                                    )}
                                  />
                                </PopoverTrigger>
                                <PopoverContent>
                                  <p className='text-sm'>{tooltipText}</p>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className='w-full flex items-center justify-between mt-4'>
              <p className='flex items-center justify-center text-center text-xs text-muted-foreground'>
                {!isTouch
                  ? `Hover on the cells for details`
                  : 'Touch the cells for details'}
              </p>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>Less</span>
                <div className='flex gap-1'>
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'size-3 rounded-sm',
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
