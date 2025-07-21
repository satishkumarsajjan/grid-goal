'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Category } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required.')
    .max(50, 'Name must be 50 characters or less.'),
});

type FormValues = z.infer<typeof categoryFormSchema>;

const upsertCategory = (values: FormValues & { id?: string }) => {
  if (values.id) {
    return axios.patch(`/api/categories/${values.id}`, { name: values.name });
  }
  return axios.post('/api/categories', values);
};

interface CategoryFormProps {
  initialData?: Category | null;
  onFinished: () => void;
}

export function CategoryForm({ initialData, onFinished }: CategoryFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: initialData?.name || '' },
  });

  useEffect(() => {
    form.reset({ name: initialData?.name || '' });
  }, [initialData, form]);

  const mutation = useMutation({
    mutationFn: upsertCategory,
    onSuccess: () => {
      const action = initialData ? 'updated' : 'created';
      toast.success(`Category ${action}!`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['timeAllocation'] });
      queryClient.invalidateQueries({ queryKey: ['vibeAnalysis'] });
      onFinished();
    },
    onError: (error: unknown) => {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response?.status === 409) {
          toast.error('A category with this name already exists.');
        } else {
          toast.error('Failed to save category.');
        }
      } else {
        toast.error('Failed to save category.');
      }
    },
  });

  const isEditing = !!initialData;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate({ ...values, id: initialData?.id })
        )}
        className='space-y-4'
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g., Marketing, Engineering...'
                  {...field}
                />
              </FormControl>
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
            : 'Create Category'}
        </Button>
      </form>
    </Form>
  );
}
