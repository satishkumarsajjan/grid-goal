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

interface SessionControlsProps {
  onFinish: () => void; // A function to trigger the summary view
}

export function SessionControls({ onFinish }: SessionControlsProps) {
  // Get state and actions from our refactored store
  const {
    isActive,
    pauseSession,
    resumeSession,
    reset: discardSession, // We alias the 'reset' action to 'discardSession' for clarity
  } = useTimerStore();

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
          >
            <X className='h-6 w-6' />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this focus session? All progress
              will be lost and no time will be logged. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Focusing</AlertDialogCancel>
            <AlertDialogAction
              onClick={discardSession}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Yes, Discard It
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
