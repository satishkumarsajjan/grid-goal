'use client';

import { AriaLiveRegion } from '@/components/ui/AriaLiveRegion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { format, isEqual, startOfDay, subDays } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

type Preset = '7d' | '30d' | '90d' | 'custom';

function getPresetRange(preset: '7d' | '30d' | '90d'): {
  from: Date;
  to: Date;
} {
  const to = startOfDay(new Date());
  switch (preset) {
    case '7d':
      return { from: startOfDay(subDays(to, 6)), to };
    case '30d':
      return { from: startOfDay(subDays(to, 29)), to };
    case '90d':
      return { from: startOfDay(subDays(to, 89)), to };
  }
}

function getPresetFromRange(range: {
  startDate?: Date;
  endDate?: Date;
}): Preset {
  if (!range.startDate || !range.endDate) return 'custom';
  const presets: Preset[] = ['7d', '30d', '90d'];
  for (const p of presets) {
    if (p === 'custom') continue;
    const presetRange = getPresetRange(p);
    if (
      isEqual(range.startDate, presetRange.from) &&
      isEqual(range.endDate, presetRange.to)
    ) {
      return p;
    }
  }
  return 'custom';
}

function isPresetValue(value: string): value is '7d' | '30d' | '90d' {
  return ['7d', '30d', '90d'].includes(value);
}

export function AnalyticsDateRangePicker() {
  const range = useAnalyticsStore((state) => state.range);
  const setRange = useAnalyticsStore((state) => state.setRange);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const [announcement, setAnnouncement] = useState('');

  const activePreset = useMemo(() => getPresetFromRange(range), [range]);

  useEffect(() => {
    if (isPopoverOpen) {
      setDraftRange({ from: range.startDate, to: range.endDate });
    }
  }, [isPopoverOpen, range.startDate, range.endDate]);

  const handlePresetChange = (value: string) => {
    if (isPresetValue(value)) {
      const newRange = getPresetRange(value);
      setRange({ startDate: newRange.from, endDate: newRange.to });
      setAnnouncement(`Analytics updated to show data for the last ${value}.`);
    } else {
      setIsPopoverOpen(true);
    }
  };

  const handleApplyCustomRange = () => {
    if (draftRange?.from) {
      const newEndDate = draftRange.to || draftRange.from;
      setRange({ startDate: draftRange.from, endDate: newEndDate });
      setAnnouncement(
        `Analytics updated to show data from ${format(
          draftRange.from,
          'MMMM do'
        )} to ${format(newEndDate, 'MMMM do')}.`
      );
      setIsPopoverOpen(false);
    }
  };

  const handleCancel = () => {
    setDraftRange({ from: range.startDate, to: range.endDate });
    setIsPopoverOpen(false);
  };

  const handleReset = () => {
    setDraftRange(undefined);
  };

  const buttonLabel = useMemo(() => {
    if (!range.startDate || !range.endDate) return 'Pick a date';
    return `${format(range.startDate, 'LLL dd, y')} - ${format(
      range.endDate,
      'LLL dd, y'
    )}`;
  }, [range]);

  return (
    <>
      <div className='flex items-center gap-2'>
        <Select value={activePreset} onValueChange={handlePresetChange}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Select a range' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7d'>Last 7 Days</SelectItem>
            <SelectItem value='30d'>Last 30 Days</SelectItem>
            <SelectItem value='90d'>Last 90 Days</SelectItem>
            <SelectItem value='custom'>Custom Range</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn('w-[280px] justify-start text-left font-normal')}
              aria-label={`Change custom date range. Currently set to ${buttonLabel}.`}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              <span>{buttonLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              autoFocus
              mode='range'
              defaultMonth={draftRange?.from}
              selected={draftRange}
              onSelect={setDraftRange}
              numberOfMonths={2}
            />
            <div className='flex justify-between gap-2 p-3 border-t bg-muted/50'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleReset}
                className='flex items-center gap-1'
              >
                <X className='h-4 w-4' /> Reset
              </Button>
              <div className='flex gap-2'>
                <Button variant='ghost' size='sm' onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size='sm' onClick={handleApplyCustomRange}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <AriaLiveRegion message={announcement} />
    </>
  );
}
