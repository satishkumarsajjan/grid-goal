'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AWARD_CATEGORIES } from '@/lib/constants/awards';
import { type AwardId } from '@prisma/client';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface MiniAwardIconProps {
  awardId: AwardId;
  isUnlocked: boolean;
}

export function MiniAwardIcon({ awardId, isUnlocked }: MiniAwardIconProps) {
  const details = AWARD_CATEGORIES.find((cat) =>
    cat.awards.find((a) => a.id === awardId)
  )?.awards.find((a) => a.id === awardId);

  if (!details) return null;

  const Icon = details.icon;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-all',
              isUnlocked
                ? 'bg-amber-100/80 dark:bg-amber-900/30 border-amber-500/50'
                : 'bg-muted/50 border-muted-foreground/20 grayscale'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                isUnlocked
                  ? `text-amber-600 dark:text-amber-400`
                  : 'text-muted-foreground/50'
              )}
            />
            {!isUnlocked && (
              <Lock className='absolute -bottom-1 -right-1 size-4 p-0.5 bg-background text-muted-foreground rounded-full' />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className='font-bold'>{details.title}</p>
          <p className='text-xs text-muted-foreground'>{details.description}</p>
          {!isUnlocked && (
            <p className='text-xs text-amber-600 dark:text-amber-500 mt-1 font-semibold'>
              LOCKED
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
