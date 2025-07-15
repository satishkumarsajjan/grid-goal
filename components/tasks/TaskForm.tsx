'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Task } from '@prisma/client';
import { useEffect } from 'react';

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

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  estimatedTimeInHours: z.coerce.number().min(0).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// This function now handles both POST (create) and PATCH (update)
const upsertTask = async ({
  values,
  goalId,
  initialData,
}: {
  values: TaskFormValues;
  goalId: string;
  initialData?: Task;
}): Promise<AxiosResponse<Task>> => {
  const apiPayload = {
    title: values.title,
    goalId: goalId,
    estimatedTimeSeconds: (values.estimatedTimeInHours ?? 0) * 3600,
  };
  if (apiPayload.estimatedTimeSeconds <= 0) {
    delete (apiPayload as any).estimatedTimeSeconds;
  }

  if (initialData?.id) {
    return axios.patch(`/api/tasks/${initialData.id}`, apiPayload);
  } else {
    return axios.post('/api/tasks', apiPayload);
  }
};

interface TaskFormProps {
  goalId: string;
  initialData?: Task; // The task to edit
  onFinished: () => void; // Callback to close the dialog
  isDisabled?: boolean;
}

export function TaskForm({
  goalId,
  initialData,
  onFinished,
  isDisabled = false,
}: TaskFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      estimatedTimeInHours: initialData?.estimatedTimeSeconds
        ? initialData.estimatedTimeSeconds / 3600
        : undefined,
    },
  });

  // Reset form if the initialData changes
  useEffect(() => {
    form.reset({
      title: initialData?.title || '',
      estimatedTimeInHours: initialData?.estimatedTimeSeconds
        ? initialData.estimatedTimeSeconds / 3600
        : undefined,
    });
  }, [initialData, form]);

  const mutation = useMutation({
    mutationFn: upsertTask,
    onSuccess: () => {
      const action = isEditing ? 'updated' : 'created';
      toast.success(`Task ${action}!`);
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['estimationAccuracy'] });
      onFinished();
    },
    onError: () => toast.error('Failed to save task.'),
  });

  function onSubmit(values: TaskFormValues) {
    if (!values.title.trim()) return;
    mutation.mutate({ values, goalId, initialData });
  }

  const isFormDisabled = mutation.isPending || isDisabled;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input
                  placeholder='What needs to be done?'
                  disabled={isFormDisabled}
                  {...field}
                />
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
              <FormLabel>Time Estimate (Optional)</FormLabel>
              <FormControl>
                <div className='relative'>
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
        <Button type='submit' className='w-full' disabled={isFormDisabled}>
          {mutation.isPending
            ? isEditing
              ? 'Saving...'
              : 'Adding...'
            : isEditing
            ? 'Save Changes'
            : 'Add Task'}
        </Button>
      </form>
    </Form>
  );
}
