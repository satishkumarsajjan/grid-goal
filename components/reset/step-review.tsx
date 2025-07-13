'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { forwardRef } from 'react';

export const StepReview = forwardRef<HTMLHeadingElement>((props, ref) => {
  return (
    <div className='text-center'>
      <h2
        ref={ref}
        tabIndex={-1}
        className='text-3xl font-bold tracking-tight outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm'
      >
        Review Your Week
      </h2>
      <p className='mt-2 text-muted-foreground'>
        Look back at what you accomplished and where you struggled.
      </p>

      <ScrollArea className='mt-8 text-left max-h-[400px]'>
        <div className='space-y-4 p-1'>
          <p className='text-center text-muted-foreground p-8'>
            (Your Review Content Goes Here)
          </p>

          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i}>Review item {i + 1}</p>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});
StepReview.displayName = 'StepReview';
