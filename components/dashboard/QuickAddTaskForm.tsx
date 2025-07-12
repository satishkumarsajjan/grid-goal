'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const quickTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty.'),
});

type FormValues = z.infer<typeof quickTaskSchema>;

const quickCreateTask = (values: FormValues) => {
  // This creates a task without a goalId (an "inbox" task)
  return axios.post('/api/tasks', { title: values.title });
};

export function QuickAddTaskForm() {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: { title: '' },
  });

  const mutation = useMutation({
    mutationFn: quickCreateTask,
    onSuccess: () => {
      toast.success('Task captured in your inbox.');
      // This invalidation is for a potential future "Inbox" component.
      // It won't affect the DailyFocusQueue directly unless an inbox task can be queued.
      queryClient.invalidateQueries({ queryKey: ['inboxTasks'] });
      form.reset();
    },
    onError: () => {
      toast.error('Failed to capture task.');
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className='flex items-start gap-2'
      >
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem className='flex-1'>
              <FormControl>
                <div className='relative'>
                  <Plus className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Capture a new task...'
                    className='pl-8'
                    disabled={mutation.isPending}
                    autoComplete='off'
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className='text-xs' />
            </FormItem>
          )}
        />
        <Button type='submit' size='sm' disabled={mutation.isPending}>
          Add
        </Button>
      </form>
    </Form>
  );
}
