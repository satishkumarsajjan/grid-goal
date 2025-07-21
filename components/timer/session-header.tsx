import { ChevronRight } from 'lucide-react';

interface SessionHeaderProps {
  taskTitle: string;
  goalTitle?: string;
}

export function SessionHeader({ taskTitle, goalTitle }: SessionHeaderProps) {
  return (
    <div className=' text-center px-4 w-full max-w-2xl'>
      {goalTitle && (
        <div className='flex items-center justify-center text-muted-foreground text-sm mb-1'>
          <span
            className='truncate max-w-[200px] sm:max-w-xs'
            title={goalTitle}
          >
            {goalTitle}
          </span>
          <ChevronRight className='h-4 w-4 mx-1 flex-shrink-0' />
          <span className='font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs'>
            Focusing on:
          </span>
        </div>
      )}

      <h3 className='text-xl font-semibold truncate' title={taskTitle}>
        {taskTitle}
      </h3>
    </div>
  );
}
