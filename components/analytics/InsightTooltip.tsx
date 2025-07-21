'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ReactNode } from 'react';

interface InsightTooltipProps {
  content: ReactNode;
}

export function InsightTooltip({ content }: InsightTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            aria-label='More information'
            className='group ml-2 flex-shrink-0 rounded-full p-1 transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <Info className='h-3.5 w-3.5 text-muted-foreground/50 transition-all duration-200 group-hover:text-muted-foreground group-hover:scale-110' />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side='top'
          align='start'
          className='max-w-xs p-3 leading-relaxed shadow-lg text-wrap'
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
