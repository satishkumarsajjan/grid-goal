'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

// API functions
const resetAccountAction = () => axios.patch('/api/user');
const deleteAccountAction = () => axios.delete('/api/user');

export function DangerZoneSection() {
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState('');

  const resetMutation = useMutation({
    mutationFn: resetAccountAction,
    onSuccess: () => {
      toast.success('Your account has been reset.', {
        description: 'All goals, tasks, and sessions have been cleared.',
      });
      // Invalidate all queries to refresh the entire app state
      queryClient.clear();
      // Force a page reload to ensure a clean state
      window.location.href = '/dashboard';
    },
    onError: () => {
      toast.error('Failed to reset account. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccountAction,
    onSuccess: async () => {
      toast.success('Your account has been permanently deleted.');
      // Sign the user out on the client-side and redirect to home
      await signOut({ callbackUrl: '/' });
    },
    onError: () => {
      toast.error('Failed to delete account. Please try again.');
    },
  });

  return (
    <Card className='border-destructive'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-destructive' />
          <CardTitle>Danger Zone</CardTitle>
        </div>
        <CardDescription>
          These are irreversible actions. Please proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* --- Reset Account --- */}
        <div className='flex items-center justify-between p-4 border rounded-lg'>
          <div>
            <h4 className='font-semibold'>Reset Account</h4>
            <p className='text-sm text-muted-foreground'>
              Delete all your goals, tasks, and sessions. Your account and
              settings will remain.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='outline'
                className='text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive'
              >
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all of your data, including
                  goals, tasks, and focus history. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className='py-2 space-y-2'>
                <Label htmlFor='confirm-reset'>
                  Please type <strong className='text-foreground'>RESET</strong>{' '}
                  to confirm.
                </Label>
                <Input
                  id='confirm-reset'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmText !== 'RESET' || resetMutation.isPending}
                  onClick={() => resetMutation.mutate()}
                  className='bg-destructive hover:bg-destructive/90'
                >
                  {resetMutation.isPending
                    ? 'Resetting...'
                    : 'I understand, reset my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* --- Delete Account --- */}
        <div className='flex items-center justify-between p-4 border rounded-lg'>
          <div>
            <h4 className='font-semibold'>Delete Account</h4>
            <p className='text-sm text-muted-foreground'>
              Permanently delete your account and all associated data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive'>Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your entire account and all data.
                  This is your final warning.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className='py-2 space-y-2'>
                <Label htmlFor='confirm-delete'>
                  Please type{' '}
                  <strong className='text-foreground'>DELETE</strong> to
                  confirm.
                </Label>
                <Input
                  id='confirm-delete'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={
                    confirmText !== 'DELETE' || deleteMutation.isPending
                  }
                  onClick={() => deleteMutation.mutate()}
                  className='bg-destructive hover:bg-destructive/90'
                >
                  {deleteMutation.isPending
                    ? 'Deleting...'
                    : 'I understand, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
