import { Skeleton } from '@/components/ui/skeleton';

export function TaskListSkeleton() {
  return (
    <div className='flex h-full flex-col bg-card rounded-lg border'>
      {/* Skeleton for Header */}
      <div className='p-4 border-b'>
        <Skeleton className='h-8 w-3/4 mb-2' />
        <Skeleton className='h-4 w-full' />
        <div className='flex items-center space-x-4 mt-4'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-5 w-24' />
        </div>
      </div>
      {/* Skeleton for Task Items */}
      <div className='space-y-3 p-4'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='flex items-center gap-4'>
            <Skeleton className='h-5 w-5 rounded-full' />
            <Skeleton className='h-6 w-full' />
          </div>
        ))}
      </div>
      {/* Skeleton for Footer */}
      <div className='p-4 border-t'>
        <Skeleton className='h-10 w-full' />
      </div>
    </div>
  );
}
