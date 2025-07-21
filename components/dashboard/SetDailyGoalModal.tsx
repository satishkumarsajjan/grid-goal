'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const updateDailyGoal = (minutes: number) => {
  return axios.patch('/api/user/settings', { dailyFocusGoalMinutes: minutes });
};

interface SetDailyGoalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMinutes: number | null;
}

export function SetDailyGoalModal({
  isOpen,
  onOpenChange,
  initialMinutes,
}: SetDailyGoalModalProps) {
  const queryClient = useQueryClient();
  const [goalHours, setGoalHours] = useState<string>(
    (initialMinutes ? initialMinutes / 60 : 2).toString()
  );

  const mutation = useMutation({
    mutationFn: updateDailyGoal,
    onSuccess: () => {
      toast.success('Daily goal updated!');

      queryClient.invalidateQueries({ queryKey: ['userStatus'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update daily goal.');
    },
  });

  const handleSave = () => {
    const hours = parseFloat(goalHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast.error('Please enter a valid number of hours (0-24).');
      return;
    }
    mutation.mutate(Math.round(hours * 60));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Your Daily Focus Goal</DialogTitle>
          <DialogDescription>
            Define what a productive day looks like for you. This can always be
            changed.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <Label htmlFor='goal-hours' className='mb-2 block'>
            Focus Target (in hours)
          </Label>
          <Input
            id='goal-hours'
            type='number'
            value={goalHours}
            onChange={(e) => setGoalHours(e.target.value)}
            placeholder='e.g., 2.5'
            step='0.5'
            min='0'
            max='24'
          />
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Set Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
