'use client';

import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
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
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

export function AnalyticsDateRangePicker() {
  const { range, setRange, setPreset } = useAnalyticsStore();
  const [preset, setPresetValue] = useState<'7d' | '30d' | '90d' | 'custom'>(
    '30d'
  );

  const handlePresetChange = (value: string) => {
    const newPreset = value as '7d' | '30d' | '90d' | 'custom';
    setPresetValue(newPreset);
    if (newPreset !== 'custom') {
      setPreset(newPreset);
    }
  };

  const handleCustomDateChange = (dateRange: DateRange | undefined) => {
    if (dateRange?.from && dateRange?.to) {
      setRange({ startDate: dateRange.from, endDate: dateRange.to });
    }
  };

  return (
    <div className='flex items-center gap-4'>
      <Select value={preset} onValueChange={handlePresetChange}>
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

      {preset === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[280px] justify-start text-left font-normal',
                !range && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {range.startDate && range.endDate ? (
                <>
                  {format(range.startDate, 'LLL dd, y')} -{' '}
                  {format(range.endDate, 'LLL dd, y')}
                </>
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              initialFocus
              mode='range'
              defaultMonth={range.startDate}
              selected={{ from: range.startDate, to: range.endDate }}
              onSelect={handleCustomDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
