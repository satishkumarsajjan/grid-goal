'use client';

import { useTimerStore } from '@/store/timer-store';
import { Button } from '@/components/ui/button';
import { Pause, Play, Square, X } from 'lucide-react';
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
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

interface SessionControlsProps {
  onFinish: () => void;
}

// NEW: Mutation function for deleting a session sequence
const deleteSessionSequence = async (sequenceId: string) => {
  return axios.delete('/api/focus-sessions', { data: { sequenceId } });
};

export function SessionControls({ onFinish }: SessionControlsProps) {
  const { isActive, pauseSession, resumeSession, reset, mode, sequenceId } =
    useTimerStore();

  const deleteMutation = useMutation({
    mutationFn: deleteSessionSequence,
    onSuccess: () => {
      toast.success('Session discarded.');
      reset(); // Reset the store after successful deletion
    },
    onError: () => {
      toast.error('Failed to discard session. Please try again.');
    },
  });

  const handleDiscard = () => {
    // If it's a Pomodoro session with a sequenceId, call the API
    if (mode === 'POMODORO' && sequenceId) {
      deleteMutation.mutate(sequenceId);
    } else {
      // For stopwatch or sessions without a sequenceId, just reset the store
      reset();
    }
  };

  const isPomodoroWithProgress = mode === 'POMODORO' && sequenceId;

  return (
    <div className='flex items-center justify-center gap-4'>
      {/* DISCARD BUTTON with confirmation dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant='outline'
            size='lg'
            className='w-28 h-14 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive'
            aria-label='Discard Session'
            disabled={deleteMutation.isPending}
          >
            <X className='h-6 w-6' />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {isPomodoroWithProgress
                ? "Are you sure? This will discard all progress for this session, including any automatically saved cycles. This can't be undone."
                : 'Are you sure? All progress will be lost and no time will be logged. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Focusing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Discarding...' : 'Yes, Discard It'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAUSE/RESUME BUTTON */}
      <Button
        variant='outline'
        size='lg'
        onClick={isActive ? pauseSession : resumeSession}
        className='w-28 h-14 rounded-full'
        aria-label={isActive ? 'Pause Session' : 'Resume Session'}
      >
        {isActive ? (
          <Pause className='h-6 w-6' />
        ) : (
          <Play className='h-6 w-6' />
        )}
      </Button>

      {/* FINISH & LOG BUTTON */}
      <Button
        variant='default'
        size='lg'
        className='w-28 h-14 rounded-full bg-primary hover:bg-primary/90'
        onClick={onFinish}
        aria-label='Finish and Log Session'
      >
        <Square className='h-6 w-6' />
      </Button>
    </div>
  );
}
