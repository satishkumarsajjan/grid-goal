'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { Plus, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createTaskSchema } from '@/lib/zod-schemas';
import { toast } from 'sonner';

interface CreateTaskFormProps {
  goalId: string;
}

type TaskFormValues = z.infer<typeof createTaskSchema>;

const createTask = async (values: TaskFormValues) => {
  const { data } = await axios.post('/api/tasks', values);
  return data;
};

export function CreateTaskForm({ goalId }: CreateTaskFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      goalId: goalId,
      estimatedTimeInHours: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', goalId] });
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
                    // Ensure empty string is treated as undefined, not 0
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? undefined : e.target.value
                      )
                    }
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
