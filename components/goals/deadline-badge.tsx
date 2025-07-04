import { format, isPast, differenceInDays } from 'date-fns';
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
  const isOverdue = isPast(deadline) && !isToday(deadline);
  const daysRemaining = differenceInDays(deadline, now);

  let colorClass = 'bg-secondary text-secondary-foreground'; // Default/neutral color
  let tooltipText = `Due in ${daysRemaining + 1} days`;

  if (isOverdue) {
    colorClass = 'bg-destructive/20 text-destructive-foreground';
    tooltipText = `Overdue by ${Math.abs(daysRemaining)} days`;
  } else if (daysRemaining < 0) {
    // isToday
    colorClass = 'bg-yellow-500/20 text-yellow-foreground';
    tooltipText = 'Due today';
  } else if (daysRemaining < 7) {
    colorClass = 'bg-yellow-500/20 text-yellow-foreground';
    tooltipText = `Due in ${daysRemaining + 1} days`;
  }

  function isToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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
