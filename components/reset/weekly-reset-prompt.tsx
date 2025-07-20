'use client';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { PartyPopper } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WeeklyResetPromptProps {
  shouldShow: boolean;
}

export function WeeklyResetPrompt({ shouldShow }: WeeklyResetPromptProps) {
  const { startResetFlow, resetCompletionCount } = useAppStore();
  const [isVisible, setIsVisible] = useState(shouldShow);

  useEffect(() => {
    if (resetCompletionCount > 0) {
      setIsVisible(false);
    }
  }, [resetCompletionCount]);

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
          Celebrate last week&apos;s wins and plan for success.
        </p>
      </div>
      <div className='flex gap-2'>
        <Button variant='ghost' size='sm' onClick={() => setIsVisible(false)}>
          Maybe Later
        </Button>
        <Button
          size='sm'
          onClick={() => {
            setIsVisible(false);
            startResetFlow();
          }}
        >
          Start Reset
        </Button>
      </div>
    </div>
  );
}
