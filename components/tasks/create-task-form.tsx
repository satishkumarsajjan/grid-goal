'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Clock, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
  isDisabled?: boolean;
}

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  goalId: z.string(),
  estimatedTimeInHours: z.coerce.number().min(0).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const createTask = async (values: TaskFormValues) => {
  const apiPayload = {
    title: values.title,
    goalId: values.goalId,
    estimatedTimeSeconds: (values.estimatedTimeInHours ?? 0) * 3600,
  };

  if (apiPayload.estimatedTimeSeconds <= 0) {
    delete (apiPayload as any).estimatedTimeSeconds;
  }

  const { data } = await axios.post('/api/tasks', apiPayload);
  return data;
};

export function CreateTaskForm({
  goalId,
  isDisabled = false,
}: CreateTaskFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<TaskFormValues>({
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
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      toast.success('Task created!');
      form.reset();
    },
    onError: () => toast.error('Failed to create task.'),
  });

  function onSubmit(values: TaskFormValues) {
    if (!values.title.trim()) return;
    mutation.mutate(values);
  }

  const isFormDisabled = mutation.isPending || isDisabled;

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
                    disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
                    step='0.1'
                    {...field}
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
        <Button type='submit' disabled={isFormDisabled}>
          {mutation.isPending ? 'Adding...' : 'Add'}
        </Button>
      </form>
    </Form>
  );
}
