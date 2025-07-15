'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskStatus } from '@prisma/client';
import { ArrowDownUp, Info, ListFilter } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export type FilterOption = TaskStatus | 'ALL';
export type SortOption = 'sortOrder' | 'createdAt' | 'estimatedTimeSeconds';

interface TaskListControlsProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  isDisabled: boolean;
}

export function TaskListControls({
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  isDisabled,
}: TaskListControlsProps) {
  const isMyOrderDisabled = activeFilter !== 'ALL';

  return (
    <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 px-4 py-2 border-b'>
      <div className='flex items-center gap-2'>
        <ListFilter className='h-4 w-4 text-muted-foreground flex-shrink-0' />
        <div className='grid grid-cols-2 items-center gap-1 rounded-md bg-muted p-1 flex-1 md:grid-cols-4'>
          <Button
            variant={activeFilter === 'ALL' ? 'secondary' : 'ghost'}
            size='sm'
            className='h-7 px-2 text-xs md:px-3 md:text-sm'
            onClick={() => onFilterChange('ALL')}
            disabled={isDisabled}
          >
            All
          </Button>
          <Button
            variant={
              activeFilter === TaskStatus.PENDING ? 'secondary' : 'ghost'
            }
            size='sm'
            className='h-7 px-2 text-xs md:px-3 md:text-sm'
            onClick={() => onFilterChange(TaskStatus.PENDING)}
            disabled={isDisabled}
          >
            Pending
          </Button>
          <Button
            variant={
              activeFilter === TaskStatus.IN_PROGRESS ? 'secondary' : 'ghost'
            }
            size='sm'
            className='h-7 px-2 text-xs md:px-3 md:text-sm'
            onClick={() => onFilterChange(TaskStatus.IN_PROGRESS)}
            disabled={isDisabled}
          >
            In Progress
          </Button>
          <Button
            variant={
              activeFilter === TaskStatus.COMPLETED ? 'secondary' : 'ghost'
            }
            size='sm'
            className='h-7 px-2 text-xs md:px-3 md:text-sm'
            onClick={() => onFilterChange(TaskStatus.COMPLETED)}
            disabled={isDisabled}
          >
            Completed
          </Button>
        </div>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger onClick={(e) => e.stopPropagation()} asChild>
              <Info className='h-4 w-4 text-muted-foreground/70 ml-2' />
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-wrap'>
                Select <span className='font-bold'>All</span> filter and select
                <span className='font-bold'>My order</span> in drop down to
                revert back to default.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='flex items-center gap-2'>
        <ArrowDownUp className='h-4 w-4 text-muted-foreground' />
        <Select
          value={activeSort}
          onValueChange={(value: SortOption) => onSortChange(value)}
          disabled={isDisabled}
        >
          <SelectTrigger className='w-full sm:w-[180px] h-9'>
            <SelectValue placeholder='Sort by...' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='sortOrder' disabled={isMyOrderDisabled}>
              My Order
            </SelectItem>
            <SelectItem value='createdAt'>Creation Date</SelectItem>
            <SelectItem value='estimatedTimeSeconds'>Time Estimate</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
