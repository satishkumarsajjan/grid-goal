import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  differenceInDays,
  format,
  isPast,
  isToday,
  isTomorrow,
} from 'date-fns';
import { CalendarClock } from 'lucide-react';

interface DeadlineBadgeProps {
  deadline: Date;
}

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const now = new Date();

  const isDueToday = isToday(deadline);
  const isDueTomorrow = isTomorrow(deadline);
  const isOverdue = isPast(deadline) && !isDueToday;
  const daysRemaining = differenceInDays(deadline, now);

  let colorClass = 'bg-secondary text-secondary-foreground';
  let tooltipText = `Due in ${daysRemaining + 1} days`;

  if (isOverdue) {
    colorClass = 'bg-destructive/20 text-destructive';
    tooltipText = `Overdue by ${Math.abs(daysRemaining)} days`;
  } else if (isDueToday || isDueTomorrow) {
    colorClass = 'bg-destructive/20 text-destructive';
    tooltipText = isDueToday ? 'Due today' : 'Due tomorrow';
  } else if (daysRemaining < 7) {
    colorClass = 'bg-amber-500/20 text-amber-700 dark:text-amber-400';

    tooltipText = `Due in ${daysRemaining + 1} days`;
  }

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
