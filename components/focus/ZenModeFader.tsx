'use client';

import { useIdle } from '@/hooks/use-idle';
import { cn } from '@/lib/utils';
import React from 'react';

interface ZenModeFaderProps {
  children: React.ReactNode;
}

export function ZenModeFader({ children }: ZenModeFaderProps) {
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
