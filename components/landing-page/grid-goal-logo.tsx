import Link from 'next/link';

const GridGoalLogo = () => {
  const size = 28;
  const squareSize = 8;
  const gap = 2;
  const cornerRadius = 2;

  return (
    <Link
      href='/'
      className='flex items-center gap-2'
      aria-label='GridGoal Home'
    >
      {/* SVG remains unchanged */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden='true'
      >
        <rect
          x={0}
          y={0}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
        <rect
          x={squareSize + gap}
          y={0}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a' // This is tailwind's green-600
        />
        <rect
          x={(squareSize + gap) * 2}
          y={0}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
        <rect
          x={0}
          y={squareSize + gap}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a'
        />
        <rect
          x={squareSize + gap}
          y={squareSize + gap}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
        <rect
          x={(squareSize + gap) * 2}
          y={squareSize + gap}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a'
        />
        <rect
          x={0}
          y={(squareSize + gap) * 2}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
        <rect
          x={squareSize + gap}
          y={(squareSize + gap) * 2}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a'
        />
        <rect
          x={(squareSize + gap) * 2}
          y={(squareSize + gap) * 2}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
      </svg>

      {/* --- START: MODIFIED TEXT & BADGE --- */}
      <div className='relative'>
        <span className='font-bold text-lg'>GridGoal</span>
        <span
          className='absolute top-0 left-full ml-1.5 -translate-y-1 bg-green-600 text-white text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full'
          aria-hidden='true'
        >
          BETA
        </span>
      </div>
      {/* --- END: MODIFIED TEXT & BADGE --- */}
    </Link>
  );
};

export default GridGoalLogo;
