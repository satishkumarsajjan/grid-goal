'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { Plus } from 'lucide-react';

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

// Zod schema for JUST this form's values.
// The goalId will be passed separately.
const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty.').max(255),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Define the mutation function that calls our API
const createTask = async ({
  title,
  goalId,
}: {
  title: string;
  goalId: string;
}) => {
  const { data } = await axios.post('/api/tasks', { title, goalId });
  return data;
};

export function CreateTaskForm({ goalId }: CreateTaskFormProps) {
  const queryClient = useQueryClient();

  // 1. Set up the useForm hook
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
    },
  });

  // 2. Set up the useMutation hook
  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      // When a new task is created, invalidate the query for the current goal's tasks.
      // This will trigger a re-fetch and the new task will appear in the list.
      queryClient.invalidateQueries({ queryKey: ['tasks', goalId] });
      form.reset(); // Clear the input field
    },
    onError: (error: AxiosError) => {
      console.error('Failed to create task:', error);
      const errorMsg = (error.response?.data as any)?.error?.title
        ?._errors?.[0];
      // Set an error on the form field itself for a great UX
      if (errorMsg) {
        form.setError('title', { type: 'server', message: errorMsg });
      }
    },
  });

  // 3. Define the onSubmit function
  function onSubmit(values: TaskFormValues) {
    // Call the mutation, passing both the form's title and the goalId from props
    mutation.mutate({ title: values.title, goalId });
  }

  return (
    // 4. Build the UI with the Shadcn Form component
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex items-start space-x-2'
      >
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem className='flex-1'>
              {/* We don't need a <FormLabel> for this inline style */}
              <FormControl>
                <div className='relative'>
                  <Plus className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='Add a task...'
                    className='pl-8'
                    disabled={mutation.isPending}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={mutation.isPending}>
          {mutation.isPending ? 'Adding...' : 'Add Task'}
        </Button>
      </form>
    </Form>
  );
}
