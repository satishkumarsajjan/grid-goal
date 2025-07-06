import { TaskStatus } from '@prisma/client';
import { CheckCircle2, CircleDashed, Loader } from 'lucide-react';

export function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case TaskStatus.COMPLETED:
      return <CheckCircle2 className='h-5 w-5 text-green-500' />;
    case TaskStatus.IN_PROGRESS:
      return <Loader className='h-5 w-5 text-blue-500 ' />;
    case TaskStatus.PENDING:
    default:
      return (
        <CircleDashed className='h-5 w-5 text-muted-foreground transition-colors' />
      );
  }
}
