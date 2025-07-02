'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { Plus, FolderPlus } from 'lucide-react';

import { createGoalSchema } from '@/lib/zod-schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type GoalFormValues = z.infer<typeof createGoalSchema>;

/**
 * Creates a new goal by sending goal data to the API endpoint.
 *
 * @param newGoalData - The goal form data validated against the create goal schema
 * @returns Promise that resolves to the created goal data from the API response
 */
const createGoal = async (newGoalData: GoalFormValues) => {
  const { data } = await axios.post('/api/goals', newGoalData);
  return data;
};

interface CreateGoalButtonProps {
  parentId?: string;
  asMenuItem?: boolean;
}
/**
 * A reusable button component that opens a dialog for creating new goals or sub-goals.
 * Supports both icon button and menu item display modes, with form validation and API integration.
 *
 * @param parentId - Optional parent goal ID for creating sub-goals
 * @param asMenuItem - Whether to render as a menu item instead of an icon button
 */
export function CreateGoalButton({
  parentId,
  asMenuItem = false,
}: CreateGoalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      title: '',
      description: '',
      parentId: parentId || undefined,
    },
  });

  useEffect(() => {
    form.reset({
      title: '',
      description: '',
      parentId: parentId || undefined,
    });
  }, [parentId, form]);

  const mutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: AxiosError) => {
      const errorData = error.response?.data as { error?: string };
      console.error(
        'Failed to create goal:',
        errorData?.error || error.message
      );
    },
  });

  function onSubmit(values: GoalFormValues) {
    mutation.mutate(values);
  }

  const Trigger = asMenuItem ? (
    <div className='flex w-full cursor-pointer items-center text-sm'>
      <FolderPlus className='mr-2 h-4 w-4' />
      <span>Add Sub-Goal</span>
    </div>
  ) : (
    <Button variant='ghost' size='icon' aria-label='Create new goal'>
      <Plus className='h-4 w-4' />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{Trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {parentId ? 'Create a New Sub-Goal' : 'Create a New Goal'}
          </DialogTitle>
          <DialogDescription>
            Break down your ambitions into manageable steps. Click save when
            you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Launch a new SaaS product...'
                      disabled={mutation.isPending}
                      {...field}
                    />
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
                      placeholder='Describe the desired outcome and key results...'
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type='button'
                  variant='ghost'
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
