'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { toast } from 'sonner';
import { Goal } from '@prisma/client';

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
import { Textarea } from '@/components/ui/textarea';

// A simpler schema for just the essential fields
const onboardingGoalSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100),
  description: z.string().max(500).optional().nullable(),
});

type OnboardingGoalFormValues = z.infer<typeof onboardingGoalSchema>;

// This mutation function uses the standard /api/goals endpoint
const createGoal = async (
  values: OnboardingGoalFormValues
): Promise<AxiosResponse<Goal>> => {
  return axios.post('/api/goals', values);
};

interface OnboardingGoalFormProps {
  onFinished: (goal: Goal) => void;
}

export function OnboardingGoalForm({ onFinished }: OnboardingGoalFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<OnboardingGoalFormValues>({
    resolver: zodResolver(onboardingGoalSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (response) => {
      const newGoal = response.data;
      toast.success("Goal created! Now, what's the first step?");
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onFinished(newGoal);
    },
    onError: (error) => {
      console.error('Failed to create goal during onboarding:', error);
      toast.error('Could not create goal. Please try again.');
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
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Title</FormLabel>
              <FormControl>
                <Input autoFocus placeholder='e.g., Run a 5K race' {...field} />
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
                  placeholder='A few words about what you want to accomplish.'
                  className='resize-none'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating Goal...' : 'Create Goal & Continue'}
        </Button>
      </form>
    </Form>
  );
}
