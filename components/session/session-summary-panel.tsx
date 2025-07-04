'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { SessionVibe } from '@prisma/client';

import { useTimerStore } from '@/store/timer-store';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface SessionSummaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  durationSeconds: number;
  taskId: string;
  goalId: string;
}

// Zod schema for form validation
const summarySchema = z.object({
  noteAccomplished: z.string().max(10000, 'Note is too long.').optional(),
  noteNextStep: z.string().max(10000, 'Note is too long.').optional(),
  vibe: z.nativeEnum(SessionVibe).optional(),
});

type SummaryFormValues = z.infer<typeof summarySchema>;

// The mutation function that calls our API endpoint
const createFocusSession = async (payload: any) => {
  const { data } = await axios.post('/api/focus-sessions', payload);
  return data;
};

export function SessionSummaryPanel({
  isOpen,
  onClose,
  durationSeconds,
  taskId,
  goalId,
}: SessionSummaryPanelProps) {
  const queryClient = useQueryClient();
  // Get the stopSession action from our global store to exit Zen Mode
  const stopSession = useTimerStore((state) => state.stopSession);

  // Set up the form with React Hook Form
  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      noteAccomplished: '',
      noteNextStep: '',
    },
  });

  // Set up the mutation with TanStack Query
  const mutation = useMutation({
    mutationFn: createFocusSession,
    onSuccess: () => {
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['tasks', goalId] });
      queryClient.invalidateQueries({ queryKey: ['gridData'] });

      // CRITICAL: Call the global action to stop the timer and exit Zen Mode
      stopSession();
      form.reset(); // Reset the form for the next session
    },
    onError: (error: AxiosError) => {
      console.error('Failed to save session:', error);
      // You could display a toast notification here
    },
  });

  // Handler for form submission
  function onSubmit(values: SummaryFormValues) {
    // Construct the full payload for the API
    const payload = {
      ...values,
      startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds,
      taskId,
      goalId,
    };
    mutation.mutate(payload);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Session Summary</SheetTitle>
          <SheetDescription>
            Great work! Log what you accomplished to keep the momentum going.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-1 flex-col justify-between'
          >
            <div className='space-y-6 mt-4 pr-4 overflow-y-auto'>
              {/* Vibe Check Buttons */}
              <FormField
                control={form.control}
                name='vibe'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did it feel?</FormLabel>
                    <FormControl>
                      <div className='flex justify-around pt-2'>
                        {(['FLOW', 'NEUTRAL', 'STRUGGLE'] as const).map(
                          (vibe) => (
                            <button
                              type='button'
                              key={vibe}
                              onClick={() => field.onChange(vibe)}
                              className={cn(
                                'flex flex-col items-center gap-2 p-2 rounded-lg transition-colors',
                                field.value === vibe
                                  ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <span className='text-3xl'>
                                {vibe === 'FLOW' && '😌'}
                                {vibe === 'NEUTRAL' && '😐'}
                                {vibe === 'STRUGGLE' && '😩'}
                              </span>
                              <span className='text-xs font-medium'>
                                {vibe.charAt(0) + vibe.slice(1).toLowerCase()}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Note Accomplished */}
              <FormField
                control={form.control}
                name='noteAccomplished'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What did you accomplish?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., Finished the first draft of the API...'
                        className='min-h-[100px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Note for Next Step */}
              <FormField
                control={form.control}
                name='noteNextStep'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's the very next step?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., Write unit tests for the GET endpoint...'
                        className='min-h-[100px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className='mt-4'>
              <SheetClose asChild>
                <Button
                  type='button'
                  variant='ghost'
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save & Finish'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
