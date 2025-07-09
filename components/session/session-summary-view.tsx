'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SessionVibe, TimerMode, PomodoroCycle } from '@prisma/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { sessionSummarySchema } from '@/lib/zod-schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TagInput } from '@/components/ui/tag-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SessionSummaryViewProps {
  task: { id: string; title: string; goalId: string };
  sessionData: {
    durationSeconds: number;
    mode: TimerMode;
    pomodoroCycle: PomodoroCycle;
  };
  onSessionSaved: () => void;
  onDiscard: () => void;
}

type SummaryFormValues = z.infer<typeof sessionSummarySchema>;

const createFocusSession = async (payload: any) => {
  const { data } = await axios.post('/api/focus-sessions', payload);
  return data;
};

const fetchUserTags = async (): Promise<string[]> => {
  const { data } = await axios.get('/api/tags');
  return data.map((tag: { name: string }) => tag.name);
};

const VIBE_OPTIONS = [
  { value: SessionVibe.FLOW, label: 'Flow', emoji: '😌' },
  { value: SessionVibe.NEUTRAL, label: 'Neutral', emoji: '😐' },
  { value: SessionVibe.STRUGGLE, label: 'Struggle', emoji: '😩' },
];

export function SessionSummaryView({
  task,
  sessionData,
  onSessionSaved,
  onDiscard,
}: SessionSummaryViewProps) {
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const { data: existingTags } = useQuery({
    queryKey: ['userTags'],
    queryFn: fetchUserTags,
  });

  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(sessionSummarySchema),
    defaultValues: { noteAccomplished: '', noteNextStep: '', artifactUrl: '' },
  });

  const mutation = useMutation({
    mutationFn: createFocusSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.goalId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['userTags'] });
      toast.success('Session saved successfully!');
      onSessionSaved();
    },
    onError: () => toast.error('Failed to save session. Please try again.'),
  });

  function onSubmit(values: SummaryFormValues) {
    const payload = {
      ...values,
      artifactUrl: values.artifactUrl || null,
      startTime: new Date(
        Date.now() - sessionData.durationSeconds * 1000
      ).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: sessionData.durationSeconds,
      taskId: task.id,
      goalId: task.goalId,
      mode: sessionData.mode,
      pomodoroCycle: sessionData.pomodoroCycle,
      tags,
    };
    console.log('SESSIONSUMMARY:', sessionData);

    mutation.mutate(payload);
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return (
      [h > 0 ? `${h}h` : null, m > 0 ? `${m}m` : null]
        .filter(Boolean)
        .join(' ') || '0s'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center'
    >
      <div className='w-full max-w-lg h-full max-h-[95vh] sm:max-h-[90vh] bg-card border rounded-xl shadow-2xl flex flex-col'>
        <div className='p-6 border-b'>
          <h2 className='text-xl font-bold'>Session Summary</h2>
          <p className='text-muted-foreground'>
            You focused on{' '}
            <span className='font-semibold text-primary'>{task.title}</span> for{' '}
            <span className='font-semibold text-primary'>
              {formatDuration(sessionData.durationSeconds)}
            </span>
            .
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 flex flex-col overflow-hidden'
          >
            <div className='flex-1 space-y-6 p-6 mt-4 overflow-y-auto'>
              <FormField
                control={form.control}
                name='vibe'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did it feel?</FormLabel>
                    <FormControl>
                      <div className='flex justify-around pt-2'>
                        {VIBE_OPTIONS.map((vibe) => (
                          <button
                            type='button'
                            key={vibe.value}
                            onClick={() => field.onChange(vibe.value)}
                            className={cn(
                              'flex flex-col items-center gap-2 p-2 rounded-lg transition-all w-24',
                              field.value === vibe.value
                                ? 'bg-primary/10 text-primary ring-2 ring-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <span className='text-3xl'>{vibe.emoji}</span>
                            <span className='text-xs font-medium'>
                              {vibe.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
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
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='noteNextStep'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's the very next step?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., Write unit tests for the GET endpoint...'
                        className='min-h-[50px]'
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='artifactUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Work (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='https://figma.com/...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Tags (Optional)</FormLabel>
                <FormControl>
                  <TagInput
                    tags={tags}
                    setTags={setTags}
                    existingTags={existingTags}
                  />
                </FormControl>
              </FormItem>
            </div>
            <div className='p-6 border-t mt-auto bg-background/50 flex justify-between'>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    disabled={mutation.isPending}
                  >
                    Discard
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Discard this session log?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You can't undo this. Your focused time will not be logged.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDiscard}
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                      Yes, Discard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save & Finish'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
