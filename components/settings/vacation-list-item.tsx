'use client';

import { type PausePeriod } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

const deletePeriod = (periodId: string) =>
  axios.delete(`/api/pause-periods/${periodId}`);

export function VacationListItem({ period }: { period: PausePeriod }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deletePeriod,
    onSuccess: () => {
      toast.success('Scheduled break removed.');
      queryClient.invalidateQueries({ queryKey: ['pausePeriods'] });
    },
    onError: () => toast.error('Failed to remove break.'),
  });

  return (
    <div className='flex items-center justify-between p-3 bg-accent/50 rounded-md'>
      <div>
        <p className='text-sm font-medium'>
          {format(new Date(period.startDate), 'MMMM d, yyyy')} -{' '}
          {format(new Date(period.endDate), 'MMMM d, yyyy')}
        </p>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-muted-foreground hover:text-destructive'
        onClick={() => mutation.mutate(period.id)}
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  );
}
