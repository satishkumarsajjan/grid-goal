'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskStatus } from '@prisma/client';
import { ArrowDownUp, ListFilter, Plus } from 'lucide-react';

export type FilterOption = TaskStatus | 'ALL';
export type SortOption = 'sortOrder' | 'createdAt' | 'estimatedTimeSeconds';

interface TaskListControlsProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  isDisabled: boolean;
  onOpenCreateTaskDialog: () => void;
}

const filterOptions: { label: string; value: FilterOption }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export function TaskListControls({
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  isDisabled,
  onOpenCreateTaskDialog,
}: TaskListControlsProps) {
  const isMyOrderDisabled = activeFilter !== 'ALL';
  const activeFilterLabel = filterOptions.find(
    (f) => f.value === activeFilter
  )?.label;

  return (
    <div className='flex items-center justify-between gap-2 px-4 py-2 border-b'>
      {/* Filter Controls: Dropdown on mobile, segmented control on desktop */}
      <div className='flex items-center gap-2'>
        {/* Mobile Filter Dropdown */}
        <div className='md:hidden'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-9 flex items-center gap-2'
              >
                <ListFilter className='h-4 w-4' />
                <span>{activeFilterLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuRadioGroup
                value={activeFilter}
                onValueChange={(value) => onFilterChange(value as FilterOption)}
              >
                {filterOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Segmented Control */}
        <div className='hidden md:flex items-center gap-1 rounded-md bg-muted p-1'>
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={activeFilter === opt.value ? 'secondary' : 'ghost'}
              size='sm'
              className='h-7 px-3 text-sm'
              onClick={() => onFilterChange(opt.value)}
              disabled={isDisabled}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Sort and Add Task Buttons */}
      <div className='flex items-center gap-2'>
        <Select
          value={activeSort}
          onValueChange={(value: SortOption) => onSortChange(value)}
          disabled={isDisabled}
        >
          <SelectTrigger className='w-[140px] h-9 text-xs sm:text-sm sm:w-[160px]'>
            <div className='flex items-center gap-2'>
              <ArrowDownUp className='h-4 w-4' />
              <SelectValue placeholder='Sort by...' />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='sortOrder' disabled={isMyOrderDisabled}>
              My Order
            </SelectItem>
            <SelectItem value='createdAt'>Creation Date</SelectItem>
            <SelectItem value='estimatedTimeSeconds'>Time Estimate</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onOpenCreateTaskDialog} size='sm' className='h-9'>
          <Plus className='h-4 w-4 sm:mr-2' />
          <span className='hidden sm:inline'>Add Task</span>
        </Button>
      </div>
    </div>
  );
}
