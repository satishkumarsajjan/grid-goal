'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type AwardInfo } from '@/lib/constants/awards';
import { Lock } from 'lucide-react';

interface AwardCardProps {
  award: AwardInfo;
  isUnlocked: boolean;
}

export function AwardCard({ award, isUnlocked }: AwardCardProps) {
  const Icon = award.icon;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'award-card flex flex-col items-center text-center p-6 border rounded-2xl h-full transform transition-all duration-300',
              isUnlocked
                ? 'border-border bg-card shadow-lg hover:-translate-y-1'
                : 'bg-muted/30 border-dashed border-muted-foreground/30 grayscale'
            )}
          >
            <div
              className={cn(
                'relative flex items-center justify-center size-16 rounded-full shadow-lg mb-4 transition-all',
                isUnlocked
                  ? `bg-gradient-to-br ${award.color}`
                  : 'bg-muted-foreground/20'
              )}
            >
              <Icon
                className={cn(
                  'size-8',
                  isUnlocked ? 'text-white' : 'text-muted-foreground/60'
                )}
                strokeWidth={2}
              />
              {!isUnlocked && (
                <Lock className='absolute -bottom-1 -right-1 size-5 p-1 bg-background text-muted-foreground rounded-full' />
              )}
            </div>
            <h3 className='font-bold text-lg tracking-tight'>{award.title}</h3>
            <p className='text-sm text-muted-foreground mt-1 flex-grow'>
              {award.description}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='max-w-xs'>
          {isUnlocked ? (
            <p className='text-xs text-green-500 font-bold'>UNLOCKED</p>
          ) : (
            <p className='text-xs text-amber-500 font-bold'>LOCKED</p>
          )}
          <p className='font-semibold mt-1'>{award.title}</p>
          <p className='text-sm text-muted-foreground'>{award.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
