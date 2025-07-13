'use client';

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
import { Button } from '@/components/ui/button';
import { useTimerStore } from '@/store/timer-store';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Pause, Play, Square, X } from 'lucide-react';
import { toast } from 'sonner';

interface SessionControlsProps {
  onFinish: () => void;
}

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
      reset();
    },
    onError: () => {
      toast.error('Failed to discard session. Please try again.');
    },
  });

  const handleDiscard = () => {
    if (mode === 'POMODORO' && sequenceId) {
      deleteMutation.mutate(sequenceId);
    } else {
      reset();
    }
  };

  const isPomodoroWithProgress = mode === 'POMODORO' && sequenceId;

  return (
    <div className='flex items-center justify-center gap-4'>
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
