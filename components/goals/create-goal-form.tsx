// src/components/goals/CreateGoalForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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

// Form-specific schema for user-friendly inputs (hours/minutes)
const goalFormSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100),
  description: z.string().max(500).optional(),
  deadline: z.date().optional(),
  estimatedHours: z.coerce.number().int().min(0).optional(),
  estimatedMinutes: z.coerce.number().int().min(0).max(59).optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

// The mutation function now handles the transformation from form values to API payload
const createGoal = async (values: GoalFormValues & { parentId?: string }) => {
  // Transform hours and minutes into total seconds
  const estimatedTimeSeconds =
    (values.estimatedHours || 0) * 3600 + (values.estimatedMinutes || 0) * 60;

  // Build the object that our backend API expects
  const apiPayload = {
    title: values.title,
    description: values.description,
    deadline: values.deadline,
    parentId: values.parentId,
    // If the estimate is 0, send `undefined` so Prisma saves it as `null`.
    // Otherwise, send the calculated number.
    estimatedTimeSeconds:
      estimatedTimeSeconds > 0 ? estimatedTimeSeconds : undefined,
  };

  const { data } = await axios.post('/api/goals', apiPayload);
  return data;
};

interface CreateGoalFormProps {
  parentId?: string | null;
  onFinished: () => void; // Function to close the dialog/modal on success
}

export function CreateGoalForm({ parentId, onFinished }: CreateGoalFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: undefined,
      estimatedHours: undefined,
      estimatedMinutes: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      toast.success('Goal successfully created!');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onFinished();
    },
    onError: (error) => {
      console.error('Failed to create goal:', error);
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

        {/* Time Estimate Input Section */}
        <div>
          <FormLabel>Time Estimate (Optional)</FormLabel>
          <div className='flex items-center gap-2 pt-2'>
            <FormField
              control={form.control}
              name='estimatedHours'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='Hours'
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='estimatedMinutes'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='Minutes'
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormMessage>
            {form.formState.errors.estimatedHours?.message ||
              form.formState.errors.estimatedMinutes?.message}
          </FormMessage>
          <FormDescription className='pt-2 text-xs'>
            How long do you estimate this goal will take to complete?
          </FormDescription>
        </div>

        {/* Deadline Picker Field */}
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
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
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
