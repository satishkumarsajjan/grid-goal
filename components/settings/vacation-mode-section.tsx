'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type PausePeriod } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { VacationListItem } from './vacation-list-item';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

// --- Zod Schema, API Functions, and Component ---
const pausePeriodSchema = z
  .object({
    dateRange: z.object({
      from: z.date({ required_error: 'A start date is required.' }),
      to: z.date({ required_error: 'An end date is required.' }),
    }),
  })
  .refine((data) => data.dateRange.to >= data.dateRange.from, {
    message: "End date can't be before start date.",
    path: ['dateRange'],
  });

type FormValues = z.infer<typeof pausePeriodSchema>;

const fetchPeriods = async (): Promise<PausePeriod[]> =>
  (await axios.get('/api/pause-periods')).data;
const createPeriod = async (data: { startDate: Date; endDate: Date }) =>
  (await axios.post('/api/pause-periods', data)).data;

export function VacationModeSection() {
  const queryClient = useQueryClient();
  const { data: periods, isLoading } = useQuery<PausePeriod[]>({
    queryKey: ['pausePeriods'],
    queryFn: fetchPeriods,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(pausePeriodSchema),
  });

  const mutation = useMutation({
    mutationFn: createPeriod,
    onSuccess: () => {
      toast.success('Vacation period scheduled!');
      queryClient.invalidateQueries({ queryKey: ['pausePeriods'] });
      form.reset();
    },
    onError: () => toast.error('Failed to schedule vacation.'),
  });

  function onSubmit(data: FormValues) {
    mutation.mutate({
      startDate: data.dateRange.from,
      endDate: data.dateRange.to,
    });
  }

  return (
    <div className='p-6 border rounded-lg'>
      <h2 className='text-xl font-semibold'>Vacation Mode</h2>
      <p className='text-muted-foreground mt-1'>
        Schedule planned breaks to pause your streak counter. No progress will
        be lost.
      </p>

      <div className='mt-6 grid gap-8 md:grid-cols-2'>
        <div>
          <h3 className='font-semibold mb-4'>Schedule a New Break</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='dateRange'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Date Range</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {field.value?.from ? (
                            field.value.to ? (
                              `${format(
                                field.value.from,
                                'LLL d, y'
                              )} - ${format(field.value.to, 'LLL d, y')}`
                            ) : (
                              format(field.value.from, 'LLL d, y')
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='range'
                          selected={field.value}
                          onSelect={field.onChange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              <Button type='submit' disabled={mutation.isPending}>
                <Plus className='mr-2 h-4 w-4' />
                {mutation.isPending ? 'Scheduling...' : 'Schedule Break'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <div>
        <h3 className='font-semibold my-4'>Scheduled Breaks</h3>
        <div className='space-y-2'>
          {isLoading && (
            <>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </>
          )}
          {periods?.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No breaks scheduled.
            </p>
          )}
          {periods?.map((period) => (
            <VacationListItem key={period.id} period={period} />
          ))}
        </div>
      </div>
    </div>
  );
}
