'use client';

import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';
import { useState } from 'react';

interface WeeklyResetPromptProps {
  // We pass this down from a server component to avoid layout shift.
  shouldShow: boolean;
}

export function WeeklyResetPrompt({ shouldShow }: WeeklyResetPromptProps) {
  const startResetFlow = useAppStore((state) => state.startResetFlow);
  const [isVisible, setIsVisible] = useState(shouldShow);

  if (!isVisible) {
    return null;
  }

  return (
    <div className='p-4 bg-accent/80 border rounded-lg flex items-center justify-between mb-8'>
      <div>
        <h3 className='font-semibold flex items-center gap-2'>
          <PartyPopper className='h-5 w-5 text-primary' />
          Ready for your Weekly Reset?
        </h3>
        <p className='text-sm text-muted-foreground mt-1'>
          Celebrate last week's wins and plan for success.
        </p>
      </div>
      <div className='flex gap-2'>
        <Button variant='ghost' size='sm' onClick={() => setIsVisible(false)}>
          Maybe Later
        </Button>
        <Button size='sm' onClick={startResetFlow}>
          Start Reset
        </Button>
      </div>
    </div>
  );
}
