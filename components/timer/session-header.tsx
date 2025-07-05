interface SessionHeaderProps {
  taskTitle: string;
}

export function SessionHeader({ taskTitle }: SessionHeaderProps) {
  return (
    <div className='absolute top-8 text-center px-4'>
      <p className='text-muted-foreground'>Focusing on:</p>
      <h3 className='text-xl font-semibold truncate max-w-sm'>{taskTitle}</h3>
    </div>
  );
}
