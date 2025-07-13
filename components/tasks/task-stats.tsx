import { CheckCircle2, CircleDashed, Loader } from 'lucide-react';

interface TaskStatsProps {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export function TaskStats({
  total,
  completed,
  inProgress,
  pending,
}: TaskStatsProps) {
  if (total === 0) {
    return null;
  }

  return (
    <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
      <div className='flex items-center gap-1.5'>
        <CheckCircle2 className='h-4 w-4 text-green-500' />
        <span>{completed} Completed</span>
      </div>
      <div className='flex items-center gap-1.5'>
        <Loader className='h-4 w-4 text-blue-500' />
        <span>{inProgress} In Progress</span>
      </div>
      <div className='flex items-center gap-1.5'>
        <CircleDashed className='h-4 w-4 text-gray-400' />
        <span>{pending} Pending</span>
      </div>
    </div>
  );
}
