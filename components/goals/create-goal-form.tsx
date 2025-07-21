'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Goal } from '@prisma/client';

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
      <FormLabel>Color</FormLabel>
      <FormDescription className='text-xs pb-2'>
        Pick a color for your goal.
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

const goalFormSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100),
  description: z.string().max(500).optional().nullable(),
  deadline: z.date().optional().nullable(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

const upsertGoal = async ({
  values,
  initialData,
}: {
  values: GoalFormValues & { color?: string | null; parentId?: string };
  initialData?: Goal | null;
}): Promise<AxiosResponse<Goal>> => {
  const apiPayload = {
    ...values,
  };

  if (initialData?.id) {
    return axios.patch(`/api/goals/${initialData.id}`, apiPayload);
  } else {
    return axios.post('/api/goals', apiPayload);
  }
};

interface GoalFormProps {
  initialData?: Goal | null;
  parentId?: string | null;
  onFinished: () => void;
}

export function GoalForm({ initialData, parentId, onFinished }: GoalFormProps) {
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialData?.color || null
  );

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      deadline: initialData?.deadline
        ? new Date(initialData.deadline)
        : undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description || '',
        deadline: initialData.deadline
          ? new Date(initialData.deadline)
          : undefined,
      });
      setSelectedColor(initialData.color || null);
    }
  }, [initialData, form]);

  const mutation = useMutation({
    mutationFn: upsertGoal,

    onSuccess: (response, variables) => {
      const isEditing = !!variables.initialData;
      const action = isEditing ? 'updated' : 'created';
      toast.success(`Goal successfully ${action}!`);

      queryClient.invalidateQueries({ queryKey: ['goals'] });

      if (isEditing && variables.initialData?.id) {
        const goalId = variables.initialData.id;

        queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', goalId] });
        queryClient.invalidateQueries({ queryKey: ['timeAllocation'] });
        queryClient.invalidateQueries({ queryKey: ['vibeAnalysis'] });
        queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      }

      onFinished();
    },

    onError: (error) => {
      const action = initialData ? 'update' : 'create';
      console.error(`Failed to ${action} goal:`, error);
      toast.error(`Failed to ${action} goal. Please try again.`);
    },
  });

  function onSubmit(values: GoalFormValues) {
    mutation.mutate({
      values: {
        ...values,
        parentId: parentId ?? undefined,
        color: selectedColor,
      },
      initialData,
    });
  }

  const isEditing = !!initialData;

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
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <GoalColorPicker
          selectedColor={selectedColor}
          onSelectColor={(color) =>
            setSelectedColor(color === selectedColor ? null : color)
          }
        />

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
                    selected={field.value ?? undefined}
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
          {mutation.isPending
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
            ? 'Save Changes'
            : 'Create Goal'}
        </Button>
      </form>
    </Form>
  );
}
