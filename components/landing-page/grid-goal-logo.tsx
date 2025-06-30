const GridGoalLogo = () => {
  return (
    <a href='/' className='flex items-center gap-2' aria-label='GridGoal Home'>
      <div className='grid grid-cols-3 gap-0.5'>
        <div className='w-2 h-2 bg-foreground rounded-sm'></div>
        <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
        <div className='w-2 h-2 bg-foreground rounded-sm'></div>
        <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
        <div className='w-2 h-2 bg-foreground rounded-sm'></div>
        <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
        <div className='w-2 h-2 bg-foreground rounded-sm'></div>
        <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
        <div className='w-2 h-2 bg-foreground rounded-sm'></div>
      </div>
      <span className='font-bold text-lg'>GridGoal</span>
    </a>
  );
};

export default GridGoalLogo;
