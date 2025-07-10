'use client';

import React from 'react';
import { useIdle } from '@/hooks/use-idle';
import { cn } from '@/lib/utils';

interface ZenModeFaderProps {
  children: React.ReactNode;
}

/**
 * A client component that uses the useIdle hook to apply a fade-out
 * effect to its children after a period of inactivity.
 * This isolates the re-rendering caused by the useIdle hook,
 * preventing it from affecting other parts of the UI like the timer animation.
 */
export function ZenModeFader({ children }: ZenModeFaderProps) {
  // The useIdle hook and its state updates are now contained within this component.
  const isIdle = useIdle(3000);

  return (
    <div
      className={cn(
        'w-full transition-opacity duration-500',
        isIdle ? 'opacity-0' : 'opacity-100'
      )}
    >
      {children}
    </div>
  );
}
