'use client';

import useDeviceDetect from '@/lib/hooks/use-hover-support';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { GridCellData, ProcessedGridData } from '@/lib/grid-helpers';

interface ActivityGridProps extends ProcessedGridData {}

const getColorClass = (level: GridCellData['level']): string => {
  switch (level) {
    case 1:
      return 'bg-green-500/40';
    case 2:
      return 'bg-green-500/60';
    case 3:
      return 'bg-green-500/80';
    case 4:
      return 'bg-green-500';
    case 0:
    default:
      return 'bg-muted';
  }
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

const Cell = React.memo(function Cell({
  cell,
  isTouch,
}: {
  cell: GridCellData;
  isTouch: boolean;
}) {
  if (cell.totalSeconds === -1) {
    return <div className='size-3.5' />;
  }

  const { date, totalSeconds, level } = cell;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const timeText = formatFocusTime(totalSeconds);
  const tooltipText =
    level === 0
      ? `No activity on ${formattedDate}`
      : `${timeText} of focus on ${formattedDate}`;

  const cellElement = (
    <div
      className={cn(
        'size-3.5 rounded-[3px] transition-transform duration-150 ease-in-out hover:scale-125',
        getColorClass(level)
      )}
      aria-label={tooltipText}
    />
  );

  if (isTouch) {
    return (
      <Popover>
        <PopoverTrigger asChild>{cellElement}</PopoverTrigger>
        <PopoverContent className='w-auto p-2'>
          <p className='text-sm'>{tooltipText}</p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{cellElement}</TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
});

export function ActivityGrid({
  totalHours,
  gridData,
  monthBoundaries,
}: ActivityGridProps) {
  const { isTouch } = useDeviceDetect();

  if (!gridData || gridData.length === 0) {
    return (
      <div className='text-center p-8 bg-card rounded-lg border'>
        No activity to display yet. Start a focus session!
      </div>
    );
  }

  const totalColumns = Math.ceil(gridData.length / 7);

  return (
    <div className='flex flex-col p-4 sm:p-6 bg-card rounded-lg border w-full mx-auto'>
      <div className='w-full text-left mb-4'>
        <h2 className='text-base font-semibold text-card-foreground'>
          {totalHours.toLocaleString()} hours dedicated in the last year
        </h2>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className='relative flex  overflow-x-auto pb-4'>
          <div className='relative'>
            <div
              className='grid h-6'
              style={{
                gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`,
              }}
            >
              {monthBoundaries.map(({ name, columnStart }) => (
                <div
                  key={name + columnStart}
                  className='text-xs text-muted-foreground'
                  style={{ gridColumnStart: columnStart }}
                >
                  {name}
                </div>
              ))}
            </div>

            <div
              className='grid grid-flow-col grid-rows-7 gap-1'
              style={{ gridTemplateColumns: `repeat(${totalColumns}, 14px)` }}
            >
              {gridData.map((cell, index) => (
                <Cell
                  key={cell.date || `pad-${index}`}
                  cell={cell}
                  isTouch={isTouch}
                />
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>

      <div className='w-full flex items-center justify-between mt-4 text-xs text-muted-foreground'>
        <p>{isTouch ? 'Tap a cell for details' : 'Hover a cell for details'}</p>
        <div className='flex items-center gap-2'>
          <span>Less</span>
          <div className='flex gap-1'>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'size-3 rounded-sm',
                  getColorClass(level as GridCellData['level'])
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
