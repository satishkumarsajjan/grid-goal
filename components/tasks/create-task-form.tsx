'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface CreateTaskFormProps {
  goalId: string;
}

// FIX 1: Define the Zod schema for the FORM's values right here.
// This schema is what the user interacts with (hours).
const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  goalId: z.string(),
  estimatedTimeInHours: z.coerce.number().min(0).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// FIX 2: The mutation function now performs the data transformation.
const createTask = async (values: TaskFormValues) => {
  // This is the key change!
  const apiPayload = {
    title: values.title,
    goalId: values.goalId,
    // Convert hours from the form into seconds for the API.
    estimatedTimeSeconds: (values.estimatedTimeInHours ?? 0) * 3600,
  };

  // Only include the estimate if it's greater than zero.
  if (apiPayload.estimatedTimeSeconds <= 0) {
    delete (apiPayload as any).estimatedTimeSeconds;
  }

  const { data } = await axios.post('/api/tasks', apiPayload);
  return data;
};

export function CreateTaskForm({ goalId }: CreateTaskFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<TaskFormValues>({
    // Use the form-specific schema
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      goalId: goalId,
      estimatedTimeInHours: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      // Invalidate the query for the specific goal's task list
      queryClient.invalidateQueries({ queryKey: ['taskListData', goalId] });
      toast.success('Task created!');
      form.reset();
    },
    onError: () => toast.error('Failed to create task.'),
  });

  function onSubmit(values: TaskFormValues) {
    if (!values.title.trim()) return;
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex items-start gap-2'
      >
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem className='flex-1'>
              <FormControl>
                <div className='relative'>
                  <Plus className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='Add a new task...'
                    className='pl-9'
                    disabled={mutation.isPending}
                    autoComplete='off'
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='estimatedTimeInHours'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className='relative w-28'>
                  <Clock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    type='number'
                    placeholder='Hours'
                    className='pl-9'
                    disabled={mutation.isPending}
                    step='0.1'
                    {...field}
                    // This onChange logic correctly handles clearing the input
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ''
                          ? undefined
                          : parseFloat(e.target.value)
                      )
                    }
                    value={field.value ?? ''}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={mutation.isPending}>
          {mutation.isPending ? 'Adding...' : 'Add'}
        </Button>
      </form>
    </Form>
  );
}
