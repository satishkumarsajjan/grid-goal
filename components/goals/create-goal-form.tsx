'use client';

import { useState } from 'react';
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
import { GOAL_COLORS } from '@/lib/constants';

// A simple, reusable color picker component for the form
interface GoalColorPickerProps {
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
}
function GoalColorPicker({
  selectedColor,
  onSelectColor,
}: GoalColorPickerProps) {
  return (
    <div>
      <FormLabel>Color (Optional)</FormLabel>
      <FormDescription className='text-xs pb-2'>
        Pick a color for your goal, or we'll assign one for you.
      </FormDescription>
      <div className='flex flex-wrap gap-2'>
        {GOAL_COLORS.map((color) => (
          <button
            key={color}
            type='button'
            onClick={() => onSelectColor(color)}
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-transform duration-150 ease-in-out',
              selectedColor === color
                ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                : 'border-transparent hover:scale-110'
            )}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  );
}

// Form-specific schema for user-friendly inputs (hours/minutes)
const goalFormSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100),
  description: z.string().max(500).optional(),
  deadline: z.date().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

// The mutation function now handles the transformation from form values to API payload
const createGoal = async (
  values: GoalFormValues & { parentId?: string; color?: string | null }
) => {
  // Transform hours and minutes into total seconds

  // Build the object that our backend API expects
  const apiPayload = {
    title: values.title,
    description: values.description,
    deadline: values.deadline,
    parentId: values.parentId,
    color: values.color, // Pass the color (or null) to the API
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
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
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
      onFinished();
    },
    onError: (error) => {
      console.error('Failed to create goal:', error);
      toast.error('Failed to create goal. Please try again.');
    },
  });

  function onSubmit(values: GoalFormValues) {
    mutation.mutate({
      ...values,
      parentId: parentId ?? undefined,
      color: selectedColor,
    });
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

        {/* Color Picker Component */}
        <GoalColorPicker
          selectedColor={selectedColor}
          onSelectColor={(color) =>
            setSelectedColor(color === selectedColor ? null : color)
          }
        />

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
