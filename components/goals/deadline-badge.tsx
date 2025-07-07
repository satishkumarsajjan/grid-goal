// src/components/goals/deadline-badge.tsx

import {
  format,
  isPast,
  differenceInDays,
  isToday,
  isTomorrow, // <-- Import isTomorrow for clarity
} from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DeadlineBadgeProps {
  deadline: Date;
}

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const now = new Date();

  // Pre-calculate all our states for cleaner logic
  const isDueToday = isToday(deadline);
  const isDueTomorrow = isTomorrow(deadline);
  const isOverdue = isPast(deadline) && !isDueToday; // It's only overdue if it's in the past AND not today
  const daysRemaining = differenceInDays(deadline, now);

  let colorClass = 'bg-secondary text-secondary-foreground'; // Default (Neutral)
  let tooltipText = `Due in ${daysRemaining + 1} days`;

  // Logic is ordered by severity: Overdue > Urgent > Warning > Neutral
  if (isOverdue) {
    colorClass = 'bg-destructive/20 text-destructive';
    tooltipText = `Overdue by ${Math.abs(daysRemaining)} days`;
  } else if (isDueToday || isDueTomorrow) {
    // NEW: Urgent state for today and tomorrow
    colorClass = 'bg-destructive/20 text-destructive'; // Use destructive color for high urgency
    tooltipText = isDueToday ? 'Due today' : 'Due tomorrow';
  } else if (daysRemaining < 7) {
    // Warning state for the upcoming week
    colorClass = 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
    // Add 1 because differenceInDays is 0-indexed (e.g., today to 2 days from now is 1)
    tooltipText = `Due in ${daysRemaining + 1} days`;
  }
  // The 'else' case is handled by the default variable values above.

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              colorClass
            )}
          >
            <CalendarClock className='h-3 w-3' />
            <span>{format(deadline, 'MMM d, yyyy')}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
