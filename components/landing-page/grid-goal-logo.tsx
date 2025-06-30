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
          fill='#16a34a'
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

      <span className='font-bold text-lg'>GridGoal</span>
    </Link>
  );
};

export default GridGoalLogo;
