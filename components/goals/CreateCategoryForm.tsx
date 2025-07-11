'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

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

const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required.')
    .max(50, 'Name must be 50 characters or less.'),
});

type FormValues = z.infer<typeof createCategorySchema>;

const createCategory = (values: FormValues) => {
  return axios.post('/api/categories', values);
};

interface CreateCategoryFormProps {
  onFinished: () => void;
}

export function CreateCategoryForm({ onFinished }: CreateCategoryFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '' },
  });

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success('Category created!');
      // Invalidate the categories query to refetch the list for all dropdowns
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onFinished();
      form.reset(); // Clear the form for the next time it opens
    },
    onError: (error: any) => {
      // Handle specific duplicate error from the API
      if (error?.response?.status === 409) {
        toast.error('A category with this name already exists.');
      } else {
        toast.error('Failed to create category.');
      }
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
          {mutation.isPending ? 'Creating...' : 'Create Category'}
        </Button>
      </form>
    </Form>
  );
}
