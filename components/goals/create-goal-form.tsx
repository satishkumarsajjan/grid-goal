'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { createGoalSchema } from '@/lib/zod-schemas'; // Import our updated schema
import { toast } from 'sonner';

type GoalFormValues = z.infer<typeof createGoalSchema>;

const createGoal = async (values: GoalFormValues) => {
  const { data } = await axios.post('/api/goals', values);
  return data;
};

interface CreateGoalFormProps {
  parentId?: string | null;
  onFinished: () => void; // A function to close the dialog on success
}

export function CreateGoalForm({ parentId, onFinished }: CreateGoalFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      toast.success('Goal successfully created!');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onFinished(); // Close the dialog
    },
    onError: () => {
      toast.error('Failed to create goal. Please try again.');
    },
  });

  function onSubmit(values: GoalFormValues) {
    mutation.mutate({ ...values, parentId: parentId ?? undefined });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Title</FormLabel>
              <FormControl>
                <Input placeholder='e.g., Launch new SaaS product' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Describe what success looks like for this goal.'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- NEW DATE PICKER FIELD --- */}
        <FormField
          control={form.control}
          name='deadline'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Deadline (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date('1900-01-01')
                    }
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating...' : 'Create Goal'}
        </Button>
      </form>
    </Form>
  );
}
